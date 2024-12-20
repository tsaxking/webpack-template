/* eslint-disable no-dupe-class-members */
// TODO: Query Streams: https://npmjs.com/package/pg-query-stream

/* eslint-disable no-await-in-loop */
import {
    attempt,
    attemptAsync,
    Err,
    Ok,
    resolveAll,
    Result
} from '../../../shared/check';
// import cliProgress from 'cli-progress';
import { EventEmitter } from '../../../shared/event-emitter';
import { Client } from 'pg';
import {
    fromCamelCase,
    toSnakeCase,
    parseObject,
    toCamelCase,
    fromSnakeCase,
    encode,
    decode
} from '../../../shared/text';
import { bigIntDecode, bigIntEncode } from '../../../shared/objects';
import { readFile } from '../files';
import path from 'path';
import { Queries } from '../queries';
import { log } from '../../../client/utilities/logging';
import { gitBranch, gitCommit } from '../git';
import { Version } from './versions';
import fs from 'fs';
import { error } from '../terminal-logging';
import { exec } from '../run-task';
import { Blank, SQL_Type } from '../../../shared/struct';
import { __root } from '../env';
import crypto from 'crypto';
import AdmZip from 'adm-zip';

/**
 * Error class for the database
 *
 * @class DatabaseError
 * @typedef {DatabaseError}
 * @extends {Error}
 */
class DatabaseError extends Error {
    /**
     * Creates an instance of DatabaseError.
     *
     * @constructor
     * @param {string} message
     */
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

type StreamEvents<T> = {
    data: T;
    end: void;
    close: void;
    error: Error;
};

class QueryStreamer<T> {
    private readonly emitter = new EventEmitter<StreamEvents<T>>();

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);

    constructor() {
        // log('QueryStreamer created');
        // this.on('close', () => log('QueryStreamer closed'));
        // this.on('data', () => log('QueryStreamer data'));
        // this.on('end', () => log('QueryStreamer ended'));
        // this.on('error', e => log('QueryStreamer error', e));
    }

    public async pipe(fn: (data: T) => unknown) {
        return new Promise<void>((res, rej) => {
            this.on('data', fn);

            const end = () => {
                this.off('data', fn);
                this.off('end', end);
                this.off('close', end);
                this.off('error', error);
                res();
            };

            const error = (err: Error) => {
                this.off('data', fn);
                this.off('end', end);
                this.off('close', end);
                this.off('error', error);
                rej(err);
            };
            this.on('end', end);
            this.on('error', error);
            this.on('close', end);
        });
    }

    await() {
        return attemptAsync(
            async () =>
                new Promise<T[]>((res, rej) => {
                    const data: T[] = [];
                    this.on('data', d => data.push(d));
                    this.once('end', () => res(data));
                    this.once('error', e => rej(e));
                })
        );
    }
}

/**
 * Interface for using different databases in the future
 *
 * @export
 * @interface DatabaseInterface
 * @typedef {DatabaseInterface}
 */
export interface DatabaseInterface {
    /**
     * Queries the database
     *
     * @template {Record<string, unknown>} T
     * @param {Query} query
     * @returns {Promise<Result<QueryResult<T>>>}
     */
    query<T extends Record<string, unknown>>(
        query: Query
    ): Promise<Result<QueryResult<T>>>;
    /**
     * Connects to the database
     *
     * @returns {Promise<Result<boolean>>}
     */
    connect(): Promise<Result<boolean>>;
    /**
     * Creates a dump file of the database
     *
     * @param {string} target
     * @returns {Promise<Result<void>>}
     */
    dump(target: string): Promise<Result<void>>;

    stream<T extends Record<string, unknown>>(query: Query): QueryStreamer<T>;
}

/**
 * Parameter for a query
 *
 * @export
 * @typedef {SimpleParameter}
 */
export type SimpleParameter = string | number | boolean | null;

/**
 * Parameter Object for a query
 *
 * @export
 * @typedef {Parameter}
 */
export type Parameter =
    | SimpleParameter
    | {
          [key: string]: SimpleParameter;
      };

/**
 * Old query method, all paremters for a given query
 *
 * @typedef {QueryFileParams}
 * @template {keyof Queries} T
 */
type QueryFileParams<T extends keyof Queries> = Queries[T][0];

/**
 * Query object for the database
 *
 * @export
 * @class Query
 * @typedef {Query}
 */
export class Query {
    /**
     * Builds a query from a string and parameters
     * @param query Can be a query with ? or :variable, use camelCase for everything
     * @param args
     * @returns
     */
    public static build(query: string, ...args: Parameter[]): Query {
        const copied = [...args]; // no dependencies

        // remove all comments
        query = query.replaceAll(/--.*\n/g, '');

        const deCamelCase = (str: string) =>
            str.replace(
                /[A-Z]*[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/g,
                word => {
                    // log(toSnakeCase(fromCamelCase(word)));
                    let w = toSnakeCase(fromCamelCase(word));
                    if (w.startsWith('_')) {
                        w = w.slice(1);
                        // capitalize first letter
                        // w = w.charAt(0).toUpperCase() + w.slice(1);
                    }
                    return w;
                }
            );

        const qMatches = query.match(/\?/g);

        if (qMatches) {
            if (qMatches.length !== args.length) {
                throw new DatabaseError(
                    `Number of parameters does not match number of ? in query. Query: ${query}, Parameters: ${copied}`
                );
            }
            // replace each ? with a $n
            for (let i = 0; i < qMatches.length; i++) {
                query = query.replace('?', `$${i + 1}`);
            }
            return new Query(deCamelCase(query), copied);
        }

        // get every :variable in the query
        const matches = query.match(/:\w+/g);
        // log(matches);
        const newArgs: Parameter[] = [];
        if (matches) {
            // for each match, replace it with a $n
            for (let i = 0; i < matches.length; i++) {
                query = query.replace(matches[i], `$${i + 1}`);
                newArgs.push(
                    typeof copied[0] === 'object'
                        ? // if the first parameter is an object, use the key
                          (
                              copied[0] as Record<
                                  string,
                                  string | number | boolean | null
                              >
                          )[matches[i].replace(/:/g, '')]
                        : // otherwise, use the parameter
                          copied[i]
                );
            }
            return new Query(deCamelCase(query), newArgs);
        }

        return new Query(deCamelCase(query), copied);
    }

    /**
     * Builds a query object from a file and parameters
     *
     * @public
     * @static
     * @template {keyof Queries} T
     * @param {T} file
     * @param {...QueryFileParams<T> extends [undefined]
     *             ? []
     *             : QueryFileParams<T>} args
     * @returns {Promise<Result<Query>>}
     */
    public static fromFile<T extends keyof Queries>(
        file: T,
        ...args: QueryFileParams<T> extends [undefined]
            ? []
            : QueryFileParams<T>
    ): Promise<Result<Query>> {
        return attemptAsync(async () => {
            const sql = (
                await readFile(
                    path.resolve(
                        __dirname,
                        '../../storage/db/queries/',
                        file + '.sql'
                    )
                )
            ).unwrap();

            return Query.build(sql, ...(args as Parameter[]));
        });
    }

    /**
     * Query arguments
     *
     * @public
     * @readonly
     * @type {Parameter[]}
     */
    public readonly args: Parameter[];

    /**
     * Creates an instance of Query.
     *
     * @constructor
     * @param {string} sql
     * @param {Parameter[]} [args=[]]
     */
    constructor(
        public readonly sql: string,
        args: Parameter[] = []
    ) {
        this.args = bigIntEncode(args);
    }
}

/**
 * Result of a query
 *
 * @class QueryResult
 * @typedef {QueryResult}
 * @template {Record<string, unknown>} T
 */
class QueryResult<T extends Record<string, unknown>> {
    /**
     * Rows of the query result
     *
     * @public
     * @readonly
     * @type {T[]}
     */
    public readonly rows: T[];
    /**
     * Creates an instance of QueryResult.
     *
     * @constructor
     * @param {T[]} rows
     * @param {Query} query
     */
    constructor(
        rows: T[],
        public readonly query: Query
    ) {
        this.rows = bigIntDecode(
            rows.map(row =>
                parseObject(row, str => toCamelCase(fromSnakeCase(str)))
            )
        ) as T[];
    }
}

/**
 * Postgres database using the database interface
 *
 * @export
 * @class PgDatabase
 * @typedef {PgDatabase}
 * @implements {DatabaseInterface}
 */
export class PgDatabase implements DatabaseInterface {
    /**
     * Creates an instance of PgDatabase.
     *
     * @constructor
     * @param {Client} client
     */
    constructor(public readonly client: Client) {
        // super();
    }

    /**
     * Queries the database
     *
     * @public
     * @async
     * @template {Record<string, unknown>} T
     * @param {Query} query
     * @returns {Promise<Result<QueryResult<T>>>}
     */
    public async query<T extends Record<string, unknown>>(
        query: Query
    ): Promise<Result<QueryResult<T>>> {
        return attemptAsync(async () => {
            try {
                const result = await this.client.query(query.sql, query.args);
                if (!result.rows) result.rows = [];
                return new QueryResult<T>(result.rows, query);
            } catch (e) {
                error('Query Error', query, e);
                throw new DatabaseError((e as Error).message);
            }
        });
    }

    /**
     * Connects to the database
     *
     * @public
     * @async
     * @returns {Promise<Result<boolean>>}
     */
    public async connect(): Promise<Result<boolean>> {
        return attemptAsync(async () => {
            await this.client.connect();
            return true;
        });
    }

    /**
     * Creates a dump file of the database
     *
     * @public
     * @async
     * @param {string} target
     * @returns {unknown}
     */
    public async dump(target: string) {
        return attemptAsync(async () => {
            const name = this.client.database;
            const password = this.client.password;
            const host = this.client.host;
            const port = this.client.port;
            if (!name) throw new DatabaseError('No database name found');
            if (!password) throw new DatabaseError('No password found');
            // dump the database

            (
                await exec(
                    `pg_dump -U postgres -h ${host} -p ${port} -d ${name} -w ${password} -f ${target}/dump.sql`
                )
            ).unwrap();
        });
    }

    stream<T extends Record<string, unknown>>(query: Query) {
        const streamer = new QueryStreamer<T>();

        (async () => {
            const res = await this.query<T>(query);
            if (res.isErr()) return streamer.emit('error', res.error);
            for (let i = 0; i < res.value.rows.length; i++) {
                streamer.emit('data', res.value.rows[i]);
            }

            streamer.emit('end', undefined);
            streamer.emit('close', undefined);
        })();
        // const q = new QueryStream(query.sql, query.args);
        // const stream = this.client.query(q);

        // stream.on('data', (data: T) => {
        //     streamer.emit('data', data as T);
        // });

        // stream.on('end', () => {
        //     streamer.emit('end', undefined);
        // });

        // stream.on('close', () => {
        //     streamer.emit('close', undefined);
        // });

        // stream.on('error', (error: Error) => {
        //     streamer.emit('error', error);
        // });

        return streamer;
    }
}

/**
 * Database where you can pass in queries directly rather than building them from files
 *
 * @class UnsafeDatabase
 * @typedef {UnsafeDatabase}
 */
class UnsafeDatabase {
    /**
     * Creates an instance of UnsafeDatabase.
     *
     * @constructor
     * @param {DatabaseInterface} db
     */
    constructor(public readonly db: DatabaseInterface) {}

    /**
     * Connects to the database
     *
     * @public
     * @async
     * @returns {Promise<Result<boolean>>}
     */
    public async connect(): Promise<Result<boolean>> {
        return this.db.connect();
    }

    /**
     * Returns a single row from a query
     *
     * @public
     * @async
     * @template T
     * @param {Query} query
     * @returns {Promise<Result<T | undefined>>}
     */
    public async get<T>(query: Query): Promise<Result<T | undefined>> {
        return attemptAsync(async () => {
            const result = (await this.db.query(query)).unwrap();
            if (result.rows.length === 0) {
                return undefined;
            }
            return result.rows[0] as T;
        });
    }

    /**
     * Returns all rows from a query
     *
     * @public
     * @async
     * @template T
     * @param {Query} query
     * @returns {Promise<Result<T[]>>}
     */
    public async all<T>(query: Query): Promise<Result<T[]>> {
        return attemptAsync(async () => {
            return (await this.db.query(query)).unwrap().rows as T[];
        });
    }

    /**
     * Runs a query
     *
     * @public
     * @async
     * @param {Query} query
     * @returns {Promise<Result<unknown>>}
     */
    public async run(query: Query): Promise<Result<unknown>> {
        return this.db.query(query);
    }

    public stream<T extends Record<string, unknown>>(query: Query) {
        return this.db.stream<T>(query);
    }
}

/**
 * Column in a table
 *
 * @class Col
 * @typedef {Col}
 */
class Col {
    /**
     * Creates an instance of Col.
     *
     * @constructor
     * @param {string} name
     * @param {string} type
     * @param {StructTable} table
     */
    constructor(
        public readonly name: string,
        public readonly type: string
        // public readonly table: StructTable
    ) {}
}

/**
 * Backup of a table
 *
 * @class TableBackup
 * @typedef {TableBackup}
 */
export class TableBackup {
    /**
     * Creates an instance of TableBackup.
     *
     * @constructor
     * @param {string} date
     * @param {string} table
     * @param {Database} database
     */
    constructor(
        public readonly filename: string, // does not include extension
        public readonly database: Database
    ) {}

    private metadata: TableMetadata | undefined;

    get tableName() {
        return this.filename.split('-')[0];
    }

    get date() {
        return Number(this.filename.split('-')[1]);
    }

    /**
     * Restores the table to the state of the backup
     *
     * @returns {*}
     */
    async restore() {
        return attemptAsync(async () => {
            (await this.buildTable()).unwrap();
            const [t, m, v] = await Promise.all([
                this.getTable(),
                this.getMetdata(),
                this.database.getVersion()
            ]);

            const table = t.unwrap();
            const metadata = m.unwrap();
            const version = v.unwrap();

            // log('Restoring', table.name, 'to', metadata.date);

            // TODO: What if there's a backup that is compatibile but it's from a different database version?
            // Is this a problem? The database will create a backup between each version change
            if (Version.compare(version, metadata.version) !== 'equal') {
                return new Err(
                    new DatabaseError(
                        'Backup is from a different version than the current database version'
                    )
                );
            }

            const hash = (await table.getHash()).unwrap();

            if (hash === metadata.hash) {
                // table is in the same state, no reason to restore
                return new Ok(undefined);
            }

            // log('Backing up table');
            (await table.backup()).unwrap();
            // log('Clearing table');
            (await table.clear()).unwrap();

            // need to drop so we can recreate the table with the correct schema
            // this is important because when migrating versions, it's possible for the schema to change
            // and if the version fails, we should restore to the most recent schema
            // log('Dropping table');
            (await table.drop()).unwrap();
            // log('Recreating table');
            (await this.buildTable()).unwrap();
            // return;

            // Did it in here so I could isolate the stream side of the function
            // eslint-disable-next-line no-async-promise-executor
            return await new Promise<void>(async (res, rej) => {
                let resolved = false;
                const resolve = () => {
                    if (resolved) return;
                    resolved = true;
                    // log('Resolved promise', err);
                    if (err) rej(err);
                    else res();
                };

                const rs = new EventEmitter<{
                    data: string;
                    end: void;
                    close: void;
                    error: Error;
                }>();

                // TODO: the file doesn't exist here in right now

                const data = await fs.promises.readFile(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${this.filename}.backupv2`
                    ),
                    'utf-8'
                );

                const schema = metadata.schema;

                let err: DatabaseError;

                let row = 0;
                let headers: string[] = [];

                const makeType = (type: string, data: string) => {
                    type = type.toLowerCase();
                    if (type.includes('int')) return Number(data);
                    if (type.includes('bool')) return data === 'true';
                    return data;
                };

                rs.on('data', async d => {
                    if (row === 0) {
                        headers = d.toString().split(',').map(decode);
                    } else {
                        if (!headers.length) {
                            // rs.close();
                            err = new DatabaseError(
                                `Did not find any headers for ${table.name} in backup`
                            );
                            return resolve();
                        }
                        const data = d
                            .toString()
                            .split(',')
                            .map(decode)
                            .reduce((acc, cur, i) => {
                                const type = schema
                                    .find(
                                        s =>
                                            toCamelCase(
                                                fromSnakeCase(s.columnName)
                                            ) === headers[i]
                                    )
                                    ?.dataType.toLowerCase();
                                if (!type)
                                    throw new Error(
                                        `No type found for ${table.name}.${headers[i]}`
                                    );

                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (acc as any)[headers[i]] = makeType(type, cur);
                                return acc;
                            }, {});

                        // log('Adding', data);

                        const res = await this.database.unsafe.run(
                            Query.build(
                                `
                            INSERT INTO ${table.name} (
                                ${Object.keys(data).join(',')}
                            ) VALUES (
                                ${Object.keys(data)
                                    .map(h => `:${h}`)
                                    .join(',')}
                            );
                        `,
                                data as Parameter
                            )
                        );

                        if (res.isErr()) error(res.error.message);
                    }
                    row++;
                });

                rs.on('end', () => {
                    // rs.close();
                    resolve(); // TODO: How should I structure the end of this function?
                });

                rs.on('close', () => {
                    resolve();
                });

                const split = data.split('\n');
                for (let i = 0; i < split.length; i++) {
                    rs.emit('data', split[i]);
                }
                rs.emit('end', undefined);
                rs.emit('close', undefined);
            });
        });
    }

    deleteFiles() {
        return attemptAsync(async () => {
            return Promise.all([
                fs.promises.rm(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${this.filename}.backupv2`
                    )
                ),
                fs.promises.rm(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${this.filename}.metadatav2`
                    )
                )
            ]);
        });
    }

    /**
     * Creates a read stream of the backup
     *
     */
    read() {
        return attempt(() => {
            return fs.createReadStream(
                path.resolve(
                    __root,
                    './storage/db/backups',
                    `${this.filename}.backupv2`
                )
            );
        });
    }

    getTable() {
        return attemptAsync(async () => {
            const table = (await this.database.getTables())
                .unwrap()
                .find(t => t.name === this.tableName);
            if (!table)
                throw new DatabaseError(
                    `Unable to find table ${this.tableName}`
                );
            return table;
        });
    }

    getMetdata(): Promise<Result<TableMetadata>> {
        return attemptAsync(async () => {
            if (this.metadata) return this.metadata;
            const data = await fs.promises.readFile(
                path.resolve(
                    __root,
                    './storage/db/backups',
                    `${this.filename}.metadatav2`
                ),
                'utf-8'
            );

            const parsed = JSON.parse(data);
            const error = (reason: string) =>
                new DatabaseError(
                    `${this.filename}.metadatav2 is malformed: ${reason}`
                );
            if (!parsed) throw error('Is empty');
            if (Array.isArray(parsed)) throw error('Expected object');
            if (!Object.hasOwn(parsed, 'name')) throw error('Missing name');
            if (!Object.hasOwn(parsed, 'branch')) throw error('Missing branch');
            if (!Object.hasOwn(parsed, 'commit')) throw error('Missing commit');
            if (!Object.hasOwn(parsed, 'date')) throw error('Missing date');
            if (!Object.hasOwn(parsed, 'hash')) throw error('Missing hash');

            this.metadata = parsed as TableMetadata;

            return parsed as TableMetadata;
        });
    }

    copy(dir: string) {
        return attemptAsync(async () => {
            // TODO: Ensure dir is an absolute path
            await Promise.all([
                fs.promises.copyFile(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${this.filename}.backupv2`
                    ),
                    path.resolve(dir, `${this.filename}.backupv2`)
                ),
                fs.promises.copyFile(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${this.filename}.metadatav2`
                    ),
                    path.resolve(dir, `${this.filename}.metadatav2`)
                )
            ]);

            // await Promise.all([
            //     fs.promises.unlink(
            //         path.resolve(
            //             __root,
            //             './storage/db/backups',
            //             `${this.filename}.backupv2`
            //         )
            //     ),
            //     fs.promises.unlink(
            //         path.resolve(
            //             __root,
            //             './storage/db/backups',
            //             `${this.filename}.metadatav2`
            //         )
            //     )
            // ]);
        });
    }

    buildTable() {
        return attemptAsync(async () => {
            const metadata = (await this.getMetdata()).unwrap();
            const { schema, name } = metadata;

            const query = Query.build(`
                CREATE TABLE IF NOT EXISTS ${name} (
                    ${schema
                        .map(s => `${s.columnName} ${s.dataType}`)
                        .join(',')}
                );
            `);

            return (await this.database.unsafe.run(query)).unwrap();
        });
    }
}

type Schema = {
    columnName: string;
    dataType: string;
};

type TableMetadata = {
    name: string;
    branch: string;
    commit: string;
    date: string;
    hash: string;
    version: [number, number, number];
    schema: Schema[];
};

class Table {
    constructor(
        public readonly name: string,
        public readonly database: Database
    ) {}

    getSchema() {
        return this.database.unsafe.all<Schema>(
            Query.build(
                `
                    SELECT
                        columnName,
                        dataType --,
                        -- characterMaximumLength
                    FROM INFORMATION_SCHEMA.COLUMNS WHERE tableName = :tableName
                `,
                {
                    tableName: toSnakeCase(fromCamelCase(this.name))
                }
            )
        );
    }

    create() {
        return attemptAsync(async () => {
            const schema = (await this.getSchema()).unwrap();
            (
                await this.database.unsafe.run(
                    Query.build(`
                CREATE TABLE IF NOT EXISTS ${this.name} (
                    ${schema.map(s => `${s.columnName} ${s.dataType}`).join()}
                );
            `)
                )
            ).unwrap();
        });
    }

    hasSchema(compare: Schema[]) {
        return attemptAsync(async () => {
            const current = (await this.getSchema()).unwrap();

            const every =
                (to: Schema[]) =>
                (s: Schema): boolean => {
                    const exists = to.find(t => t.columnName === s.columnName);
                    if (!exists) return false;
                    return s.dataType === exists.dataType;
                };

            // it is possible for one to have more columns than the other, so we must to the same comparison on both to handle all edge cases
            return (
                current.every(every(compare)) && compare.every(every(current))
            );
        });
    }

    // TODO: cache that should deplete quickly
    // private __all: {
    //     [key: string]: unknown;
    // }[] = [];

    all() {
        // return attemptAsync(async () => {
        // if (this.__all.length) return this.__all;
        // this.__all =
        return this.database.unsafe.stream<{
            [key: string]: unknown;
        }>(Query.build(`SELECT * FROM ${this.name};`));
        // setTimeout(() => this.__all = []);
        // return this.__all;
        // });
    }

    getHash() {
        return attemptAsync(
            async () =>
                new Promise<string>((res, rej) => {
                    let str = '';
                    const stream = this.all();
                    const run = (d: Record<string, unknown>) => {
                        if (!str.length) {
                            str = Object.keys(d).join(',');
                        }

                        str += JSON.stringify(Object.values(d));
                    };

                    stream.on('data', run);

                    stream.once('end', () => {
                        res(
                            crypto
                                .pbkdf2Sync(str, 'salt', 1, 64, 'sha512')
                                .toString('hex')
                        );
                        stream.off('data', run);
                    });

                    stream.once('error', rej);
                })
        );
    }

    backup(force = false) {
        return attemptAsync(async () => {
            const backups = (await this.getBackups()).unwrap();
            const thisHash = (await this.getHash()).unwrap();

            // if the table states are the same, return the backup that has the same table state
            if (!force) {
                const last = backups[backups.length - 1];
                if (last) {
                    const m = (await last.getMetdata()).unwrap();
                    if (thisHash === m.hash) return last;
                }
            }

            // TODO: This method cannot be done with blobs
            // const all = (await this.all().await()).unwrap();
            // if (!all.length) return;

            const stream = this.all();

            const { name } = this;
            const filename = `${name}-${Date.now()}`;

            const ws = fs.createWriteStream(
                path.resolve(
                    __root,
                    './storage/db/backups',
                    `${filename}.backupv2`
                )
            );
            stream.on('end', () => ws.close());
            stream.on('close', () => ws.close());

            let i = 0;
            let headers: string[] = [];
            await stream.pipe(data => {
                if (i === 0) {
                    headers = Object.keys(data);
                    ws.write(headers.map(encode).join(',') + '\n');
                }

                ws.write(
                    headers
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map(h => encode(String((data as any)[h])))
                        .join(',') + '\n'
                );

                i++;
            });

            const date = new Date().toISOString();
            const [branch, commit] = await Promise.all([
                gitBranch(),
                gitCommit()
            ]);

            const b = branch.unwrap();
            const c = commit.unwrap();

            const metadata = JSON.stringify({
                name,
                branch: b,
                commit: c,
                date,
                hash: thisHash,
                version: (await this.database.getVersion()).unwrap(),
                schema: (await this.getSchema()).unwrap()
            });

            await fs.promises.writeFile(
                path.resolve(
                    __root,
                    './storage/db/backups',
                    `${filename}.metadatav2`
                ),
                metadata
            );

            return new TableBackup(filename, this.database);
        });
    }

    getBackups() {
        return attemptAsync(async () => {
            const files = await fs.promises.readdir(
                path.join(__root, './storage/db/backups')
            );

            return files
                .filter(f => path.extname(f).includes('backupv2'))
                .filter(f => f.includes(this.name))
                .map(f => {
                    const name = f.replace('.backupv2', '');

                    return new TableBackup(name, this.database);
                })
                .sort((a, b) => a.date - b.date);
        });
    }

    clear() {
        return this.database.unsafe.run(
            Query.build(`DELETE FROM ${this.name};`)
        );
    }

    drop() {
        return attemptAsync(async () => {
            const all = (await this.all().await()).unwrap();
            if (all.length)
                throw new DatabaseError('Cannot drop table that contains data');
            return (
                await this.database.unsafe.run(
                    Query.build(`DROP TABLE ${this.name};`)
                )
            ).unwrap();
        });
    }

    // verifyData() {
    //     return attemptAsync(async () => {
    //         const [a, s] = await Promise.all([
    //             this.all(),
    //             this.getSchema(),
    //         ]);

    //         const all = a.unwrap();
    //         const schema = s.unwrap();

    //         for (let i = 0; i < all.length; i++) {
    //             const d = all[i];

    //             for (let j = 0; j < schema.length; j++) {
    //                 const s = schema[j];
    //             }
    //         }
    //     });
    // }
}

class TableStruct extends Table {
    constructor(
        public readonly name: string,
        public readonly schema: Blank,
        public readonly database: Database
    ) {
        super(name, database);
    }

    // verifyData() {
    //     return attemptAsync<boolean>(async () => {
    //         const all = (await this.all()).unwrap();

    //         // TODO: Build validation function for struct data
    //         return all.every
    //     });
    // }
}

/**
 * Database class that is used to interact with a database connection
 *
 * @export
 * @class Database
 * @typedef {Database}
 */
export class Database {
    /**
     * Unsafe database
     *
     * @public
     * @readonly
     * @type {UnsafeDatabase}
     */
    public readonly unsafe: UnsafeDatabase;

    /**
     * Creates an instance of Database.
     *
     * @constructor
     * @param {DatabaseInterface} db
     */
    constructor(public readonly db: DatabaseInterface) {
        this.unsafe = new UnsafeDatabase(db);
    }

    /**
     * Query class
     *
     * @public
     * @readonly
     * @type {typeof Query}
     */
    public readonly Query = Query;

    /**
     * If the database is initialized
     *
     * @public
     * @type {boolean}
     */
    public initialized = false;

    /**
     * Connects to the database
     *
     * @public
     * @async
     * @returns {Promise<Result<boolean>>}
     */
    public async connect(): Promise<Result<boolean>> {
        return this.db.connect();
    }

    /**
     * Returns a single row from a query
     *
     * @public
     * @async
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...QueryFileParams<T> extends [undefined]
     *             ? []
     *             : QueryFileParams<T>} args
     * @returns {Promise<Result<Queries[T][1]>>}
     */
    public async get<T extends keyof Queries>(
        type: T,
        ...args: QueryFileParams<T> extends [undefined]
            ? []
            : QueryFileParams<T>
    ): Promise<Result<Queries[T][1]>> {
        if (!this.initialized)
            throw new DatabaseError('FATAL: Database not initialized');
        return attemptAsync(async () => {
            const query = (await Query.fromFile(type, ...args)).unwrap();

            const result = (await this.db.query(query)).unwrap();
            if (result.rows.length === 0) {
                console.error(type, query);
                throw new DatabaseError('No results found');
            }

            return result.rows[0] as Queries[T][1];
        });
    }

    // public stream<T extends keyof Queries>(
    //     type: T,
    //     ...args: QueryFileParams<T> extends [undefined]
    //         ? []
    //         : QueryFileParams<T>
    // ) {}

    /**
     * Returns all rows from a query
     *
     * @public
     * @async
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...QueryFileParams<T> extends [undefined]
     *             ? []
     *             : QueryFileParams<T>} args
     * @returns {Promise<Result<Queries[T][1][]>>}
     */
    public async all<T extends keyof Queries>(
        type: T,
        ...args: QueryFileParams<T> extends [undefined]
            ? []
            : QueryFileParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        if (!this.initialized)
            throw new DatabaseError('FATAL: Database not initialized');
        return attemptAsync(async () => {
            const query = (await Query.fromFile(type, ...args)).unwrap();
            return (await this.db.query(query)).unwrap()
                .rows as Queries[T][1][];
        });
    }

    /**
     * Runs a query
     *
     * @public
     * @async
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...QueryFileParams<T> extends [undefined]
     *             ? []
     *             : QueryFileParams<T>} args
     * @returns {Promise<Result<Queries[T][1]>>}
     */
    public async run<T extends keyof Queries>(
        type: T,
        ...args: QueryFileParams<T> extends [undefined]
            ? []
            : QueryFileParams<T>
    ): Promise<Result<Queries[T][1]>> {
        if (!this.initialized)
            throw new DatabaseError('FATAL: Database not initialized');
        return attemptAsync(async () => {
            const query = (await Query.fromFile(type, ...args)).unwrap();
            return (await this.db.query(query)).unwrap()
                .rows[0] as Queries[T][1];
        });
    }

    public async getTables() {
        return attemptAsync(async () => {
            return (
                await this.unsafe.all<{ name: string }>(
                    Query.build(`
                    SELECT table_name as name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                `)
                )
            )
                .unwrap()
                .map(t => t.name)
                .map(t => toCamelCase(fromSnakeCase(t)))
                .map(t => new Table(t, this));
        });
    }

    public async getStructs() {
        return attemptAsync(async () => {
            return (
                await this.unsafe.all<{
                    name: string;
                    schema: string;
                }>(Query.build('SELECT * FROM Structs'))
            )
                .unwrap()
                .map(
                    s =>
                        new TableStruct(
                            s.name,
                            JSON.parse(s.schema) as Blank,
                            this
                        )
                );
        });
    }

    /**
     * Vacuums the database
     *
     * @public
     * @async
     * @returns {unknown}
     */
    public async vacuum() {
        if (!this.initialized)
            throw new DatabaseError('Database not initialized');
        return attemptAsync(async () => {
            log('Vacuum go brrrrrrr');
            const tables = await this.getTables();
            if (tables.isErr()) throw tables.error;
            return Promise.all(
                tables.value.map(async table => {
                    const q = new Query(`VACUUM ${table};`);
                    this.unsafe.run(q);
                })
            );
        });
    }

    /**
     * Resets the database
     * If hard is true, it will drop all tables
     * If hard is false, it will only delete all data
     *
     *
     *
     * @async
     * @param {boolean} hard
     * @returns {unknown}
     */
    async reset(hard: boolean) {
        return attemptAsync(async () => {
            (await this.backup()).unwrap();
            const tables = (await this.getTables()).unwrap();
            if (hard) {
                // drop all tables
                resolveAll(
                    await Promise.all(
                        tables.map(table => {
                            console.log(`Dropping table ${table.name}`);
                            return this.unsafe.run(
                                Query.build(`DROP TABLE ${table.name};`)
                            );
                        })
                    )
                ).unwrap();
                this.initialized = false;
            } else {
                // delete all data
                resolveAll(
                    await Promise.all(
                        tables.map(table => {
                            console.log(`Clearing table ${table.name}`);
                            return this.unsafe.run(
                                Query.build(`DELETE FROM ${table.name};`)
                            );
                        })
                    )
                ).unwrap();
            }
        });
    }

    /**
     * Initializes the database
     * This function will create the Structs and Git tables if they do not exist
     * It will also update all tables to the latest version
     * It will also create a backup of the current state
     *
     * @async
     * @returns {unknown}
     */
    async init(doVersions = true) {
        return attemptAsync(async () => {
            if (this.initialized) return;

            // log('Initializing database');

            // log('Creating default tables: Structs, Git, Version');
            // this query must be safe from repeated calls
            (
                await this.unsafe.run(
                    Query.build(`
                        CREATE TABLE IF NOT EXISTS Structs (
                            name TEXT PRIMARY KEY,
                            schema TEXT NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS Git (
                            branch TEXT PRIMARY KEY,
                            commit TEXT NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS Version (
                            major INTEGER,
                            minor INTEGER,
                            patch INTEGER
                        );
                `)
                )
            ).unwrap();

            // log('Created default tables');

            let currentGit = (
                await this.unsafe.get<{
                    branch: string;
                    commit: string;
                }>(
                    Query.build(`
                    SELECT *
                    FROM Git
                `)
                )
            ).unwrap();
            const [branch, commit] = await Promise.all([
                gitBranch(),
                gitCommit()
            ]);

            const b = branch.unwrap();
            const c = commit.unwrap();

            // log(`Current branch: ${b}`);
            // log(`Current commit: ${c}`);

            if (!currentGit) {
                currentGit = {
                    branch: b,
                    commit: c
                };
            }

            (
                await this.unsafe.run(
                    Query.build(`
                        DELETE FROM Git;
                `)
                )
            ).unwrap();

            (
                await this.unsafe.run(
                    Query.build(
                        `
                        INSERT INTO Git (branch, commit)
                        VALUES (:branch, :commit);
                `,
                        {
                            branch: b,
                            commit: c
                        }
                    )
                )
            ).unwrap();

            // const versions = (await getVersions()).unwrap();

            // for (const version of versions) {
            //     const backup = (await this.backup()).unwrap();

            //     // The schema for each table must be stored with the backup
            //     try {
            //         log(`Running version update: ${version.versionStr}`);
            //         log(version.description);
            //         await version.update(this);

            //         const schemas = Object.entries(version.newSchemas);
            //         for (const [table, schema] of schemas) {
            //             const s = JSON.stringify(schema);
            //             await this.unsafe.run(
            //                 Query.build(
            //                     `
            //                     INSERT INTO Structs (name, schema)
            //                     VALUES (:name, :schema)
            //                     ON CONFLICT (name) DO UPDATE SET schema = :schema;
            //                 `,
            //                     {
            //                         name: table,
            //                         schema: s
            //                     }
            //                 )
            //             );
            //         }
            //     } catch (e) {
            //         (await this.restore(backup)).unwrap();
            //         error('Version update error:', e);
            //         throw new DatabaseError(
            //             `Error running version update: ${version.versionStr}`
            //         );
            //     }

            //     // this can't be outside the for loop because it's assumed the schema will change after the update
            //     // const structs = (await this.getStructs()).unwrap();
            //     // const valid = resolveAll(await Promise.all(structs.map(s => s.verifyData()))).unwrap();

            //     // const invalidStructs = structs.filter((s, i) => !valid[i]);

            //     // if (invalidStructs.length) {
            //     // (await this.restore(backup)).unwrap();
            //     // throw new DatabaseError(`After updating, the data inside the struct(s): ${invalidStructs.join(', ')} had invalid data. The database has been restored to the previous state and the version has been undone.`);
            //     // }

            //     (await this.setVersion(version.version)).unwrap();

            // }

            this.initialized = true;
        });
    }

    public async getVersion() {
        return attemptAsync<[number, number, number]>(async () => {
            const result = (
                await this.unsafe.get<{
                    major: number;
                    minor: number;
                    patch: number;
                }>(
                    Query.build(`
                SELECT * FROM Version
            `)
                )
            ).unwrap();

            if (!result) return [0, 0, 0];
            return [result.major, result.minor, result.patch];
        });
    }

    public async setVersion(version: [number, number, number]) {
        return attemptAsync(async () => {
            const [major, minor, patch] = version;
            (
                await this.unsafe.run(
                    Query.build(`
                DELETE FROM Version;
            `)
                )
            ).unwrap();

            (
                await this.unsafe.run(
                    Query.build(
                        `
                INSERT INTO Version (
                    major,
                    minor,
                    patch
                ) VALUES (
                    :major,
                    :minor,
                    :patch
                );
            `,
                        {
                            major,
                            minor,
                            patch
                        }
                    )
                )
            ).unwrap();
        });
    }

    /**
     * Makes a backup of the current state of the database
     *
     * @public
     * @async
     * @returns {unknown}
     */
    public async backup(doZip = false) {
        return attemptAsync<string>(async () => {
            const tables = (await this.getTables()).unwrap();

            const backups = resolveAll(
                await Promise.all(tables.map(table => table.backup()))
            )
                .unwrap()
                .filter(Boolean);

            const dir = (await this.makeCurrentBackupDir()).unwrap();
            resolveAll(
                await Promise.all(backups.map(b => b.copy(dir)))
            ).unwrap();
            resolveAll(
                await Promise.all(backups.map(b => b.deleteFiles()))
            ).unwrap();
            const parent = dir.split('/').pop() as string;

            // when extracting the backup, we need to handle the potential name conflicts
            // This should be alleviated by using Date.now(), so the backup should be the same,
            // However, it is a good idea to compare the hashes

            const zip = new AdmZip();

            const files = await fs.promises.readdir(dir);
            for (const file of files) {
                zip.addLocalFile(path.resolve(dir, file));
            }

            if (doZip) {
                await zip.writeZipPromise(
                    path.resolve(
                        __root,
                        './storage/db/backups',
                        `${parent}.zip`
                    )
                );

                await fs.promises.rm(dir, { recursive: true });
            }

            return dir;
        });
    }

    public async getBackups() {
        return attemptAsync(async () => {
            const files = await fs.promises.readdir(
                path.resolve(__root, './storage/db/backups')
            );

            return files
                .filter(
                    f =>
                        new Date(f.replace('.zip', '')).toString() !==
                        'Invalid Date'
                )
                .map(f => path.resolve(__root, './storage/db/backups', f));
        });
    }

    public async restore(backupDir: string) {
        return attemptAsync(async () => {
            (await this.backup()).unwrap();
            // may not be good to reset here, because it may not be restoring all of the tables, who knows what's in the zip file
            // This should use workers
            // This function assumes the database is in a fully blank state, tables will need to be built and data will need to be inserted

            if (backupDir.endsWith('.zip')) {
                const zip = new AdmZip(backupDir);
                const dir = path.resolve(backupDir, '..');
                zip.extractAllTo(dir + '', true); // overwrite may not do anything because the files are saved using the date
                const entries = zip.getEntries();

                // TODO: parallelize this loop
                for (const entry of entries) {
                    const name = entry.name;

                    if (name.endsWith('.backupv2')) {
                        const table = new TableBackup(
                            name.replace('.backupv2', ''),
                            this
                        );

                        (await table.restore()).unwrap();

                        await fs.promises.rm(path.resolve(dir, name), {
                            recursive: true
                        });

                        await fs.promises.rm(
                            path.resolve(
                                dir,
                                name.replace('.backupv2', '.metadatav2')
                            ),
                            { recursive: true }
                        );
                    }
                }
            } else {
                const files = await fs.promises.readdir(backupDir);
                await Promise.all(
                    files.map(f =>
                        fs.promises.copyFile(
                            path.resolve(backupDir, f),
                            path.resolve(__root, './storage/db/backups', f)
                        )
                    )
                );
                for (const file of files) {
                    if (file.endsWith('.backupv2')) {
                        const table = new TableBackup(
                            file.replace('.backupv2', ''),
                            this
                        );

                        await fs.promises.cp(
                            path.resolve(backupDir, file),
                            path.resolve(__root, './storage/db/backups', file)
                        );

                        (await table.restore()).unwrap();
                    }

                    await fs.promises.rm(path.resolve(backupDir, '..', file), {
                        recursive: true
                    });
                }
            }
        });
    }

    /**
     * Creates the directory for the current backup
     *
     * @private
     * @returns {*}
     */
    private makeCurrentBackupDir() {
        return attemptAsync(async () => {
            const name = path.resolve(
                __root,
                './storage/db/backups',
                new Date().toISOString()
            );

            await fs.promises.mkdir(name, { recursive: true });

            return name;
        });
    }

    // /**
    //  * Creates a dump file of the database
    //  *
    //  * @public
    //  * @async
    //  * @returns {unknown}
    //  */
    // public async dump() {
    //     return attemptAsync(async () => {
    //         const dir = (await this.makeCurrentBackupDir()).unwrap();
    //     });
    // }
}
