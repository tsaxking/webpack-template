import env, { __root } from './env.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { error, log } from './terminal-logging.ts';
import { Queries } from './queries.ts';
import { exists, readDir, readFile, readFileSync } from './files.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { runTask } from './run-task.ts';
import {
    capitalize,
    fromCamelCase,
    fromSnakeCase,
    parseObject,
    toCamelCase,
    toSnakeCase,
} from '../../shared/text.ts';

/**
 * The name of the main database
 * @date 1/9/2024 - 12:08:08 PM
 *
 * @type {*}
 */
const {
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
} = env;
{
    const cannotConnect =
        'FATAL: Cannot connect to the database, please check your .env file |';

    if (!DATABASE_USER) {
        throw new Error(`${cannotConnect} DATABASE_USER is not defined`);
    }
    if (!DATABASE_PASSWORD) {
        throw new Error(`${cannotConnect} DATABASE_PASSWORD is not defined`);
    }
    if (!DATABASE_NAME) {
        throw new Error(`${cannotConnect} DATABASE_NAME is not defined`);
    }
    if (!DATABASE_HOST) {
        throw new Error(`${cannotConnect} DATABASE_HOST is not defined`);
    }
    if (!DATABASE_PORT) {
        throw new Error(`${cannotConnect} DATABASE_PORT is not defined`);
    }
}

/**
 * Acceptable types for a parameter
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @typedef {Parameter}
 */
type Parameter =
    | string
    | number
    | boolean
    | null
    | {
        [key: string]: string | number | boolean | null;
    };

type QParams<T extends keyof Queries> = Queries[T][0];

export type Version = [number, number, number];

/**
 * Database class
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @export
 * @class DB
 * @typedef {DB}
 */
export class DB {
    /**
     * Database instance
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly db = new Client({
        user: DATABASE_USER,
        database: DATABASE_NAME,
        hostname: DATABASE_HOST,
        password: DATABASE_PASSWORD,
        port: Number(DATABASE_PORT),
    });

    static async connect() {
        return attemptAsync(async () => {
            return new Promise((res, rej) => {
                setTimeout(() => {
                    rej('Database connection timed out');
                }, 20 * 1000);
                return DB.db.connect().then(res).catch(rej);
            });
        });
    }

    private static parseQuery(
        query: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: any[],
    ): [string, Parameter[]] {
        const copied = JSON.parse(JSON.stringify(args)); // no dependencies

        // remove all comments
        query = query.replaceAll(/--.*\n/g, '');

        const deCamelCase = (str: string) =>
            str.replace(
                /[A-Z]*[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/g,
                (word) => {
                    // console.log(toSnakeCase(fromCamelCase(word)));
                    let w = toSnakeCase(fromCamelCase(word));
                    if (w.startsWith('_')) {
                        w = w.slice(1);
                        // capitalize first letter
                        // w = w.charAt(0).toUpperCase() + w.slice(1);
                    }
                    return w;
                },
            );

        const qMatches = query.match(/\?/g);

        if (qMatches) {
            if (qMatches.length !== args.length) {
                throw new Error(
                    `Number of parameters does not match number of ? in query. Query: ${query}, Parameters: ${copied}`,
                );
            }
            // replace each ? with a $n
            for (let i = 0; i < qMatches.length; i++) {
                query = query.replace('?', `$${i + 1}`);
            }
            return [deCamelCase(query), copied];
        }

        // get every :variable in the query
        const matches = query.match(/:\w+/g);
        const newArgs: Parameter[] = [];
        if (matches) {
            // for each match, replace it with a $n
            for (let i = 0; i < matches.length; i++) {
                query = query.replaceAll(matches[i], `$${i + 1}`);
                newArgs.push(
                    copied[0]
                        ? copied[0][matches[i].replace(/:/g, '')]
                        : copied[i],
                );
            }
            return [deCamelCase(query), newArgs];
        }

        return [deCamelCase(query), copied];
    }

    private static parseObj<T extends object>(obj: T) {
        return parseObject(obj, (str) => toCamelCase(fromSnakeCase(str)));
    }

    static async getUsers(): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            // get all users for the postgres database
            const res = await DB.unsafe.all<{ rolname: string }>(
                `
                SELECT rolname
                FROM pg_roles
                WHERE rolname != 'postgres'
                ORDER BY rolname;
            `,
            );

            if (res.isOk()) {
                return res.value.map((r) => r.rolname);
            } else {
                throw res.error;
            }
        });
    }

    // version info
    private static version?: Version;

    static async getVersion(): Promise<Version> {
        if (DB.version) return DB.version;

        const v = await DB.get('db/get-version');
        if (v.isOk() && v.value) {
            const { major, minor, patch } = v.value;
            return [major, minor, patch];
        }
        // database is not initialized
        return [-1, -1, -1];
    }

    static async setVersion(v: Version): Promise<Result<unknown>> {
        console.log('Setting version to', v.join('.'));
        const [major, minor, patch] = v;

        const del = await DB.unsafe.run('DELETE FROM Version');

        if (del.isOk()) {
            const res = await DB.unsafe.run(
                `
                INSERT INTO Version (major, minor, patch)
                VALUES (:major, :minor, :patch)
            `,
                {
                    major,
                    minor,
                    patch,
                },
            );

            if (res.isOk()) DB.version = v;
            else console.log('Error setting version', res.error);
            return res;
        } else {
            console.log('Error deleting version', del.error);
            return del;
        }
    }

    static async latestVersion(): Promise<Version> {
        const versions = await DB.getUpdates();
        if (versions.isOk()) {
            return versions.value[versions.value.length - 1];
        }
        return [0, 0, 0];
    }

    static async hasVersion(v: Version): Promise<boolean> {
        // checks if the database is at least the version provided
        const [major, minor, patch] = v;
        const [dbMajor, dbMinor, dbPatch] = await DB.getVersion();
        return (
            major < dbMajor ||
            (major === dbMajor && minor < dbMinor) ||
            (major === dbMajor && minor === dbMinor && patch <= dbPatch)
        );
    }

    static async init(): Promise<Result<void>> {
        return attemptAsync(async () => {
            if (await DB.hasVersion([0, 0, 0])) {
                console.log('Database already initialized');
                return;
            }

            const initQuery = await readFile('storage/db/queries/db/init.sql');

            if (initQuery.isOk()) {
                const res = await DB.unsafe.run(initQuery.value);
                if (res.isOk()) {
                    console.log('Database initialized');
                } else {
                    console.log('Error initializing database', res.error);
                    throw res.error;
                }
            } else {
                console.log('Error reading init query', initQuery.error);
                throw initQuery.error;
            }
        });
    }

    static async getUpdates(): Promise<Result<Version[]>> {
        return attemptAsync(async () => {
            const versions = await readDir('storage/db/queries/db/versions');
            if (versions.isOk()) {
                return versions.value
                    .map((v) => {
                        const [major, minor, patch] = v.name
                            .replace('.sql', '')
                            .split('-')
                            .map(Number);
                        return [major, minor, patch];
                    })
                    .sort((a, b) => {
                        const [aM, am, ap] = a;
                        const [bM, bm, bp] = b;

                        if (aM !== bM) {
                            return aM - bM;
                        }
                        if (am !== bm) {
                            return am - bm;
                        }
                        return ap - bp;
                    }) as Version[];
            }
            return [];
        });
    }

    static async runUpdate(version: Version): Promise<Result<boolean>> {
        return attemptAsync(async () => {
            console.log('Updating database to version', version.join('.'));
            const updateQuery = await readFile(
                `storage/db/queries/db/versions/${version.join('-')}.sql`,
            );

            if (updateQuery.isOk()) {
                const currentVersion = await DB.getVersion();
                await DB.makeBackup();

                const res = await DB.unsafe.run(updateQuery.value);
                if (res.isOk()) {
                    console.log(
                        'Database updated to version',
                        version.join('.'),
                    );

                    const script = `storage/db/scripts/versions/${
                        version.join(
                            '-',
                        )
                    }.ts`;
                    // see if update script exists
                    const scriptExists = await exists(script);

                    if (scriptExists) {
                        const scriptRes = await runTask(script);
                        if (scriptRes.isErr()) {
                            console.log(
                                'Error running update script',
                                version.join('.'),
                                scriptRes.error,
                            );
                            await DB.restoreBackup(currentVersion);
                            throw scriptRes.error;
                        }
                    }

                    DB.setVersion(version);
                    return true;
                } else {
                    console.log(
                        'Error updating database to version',
                        version,
                        res.error,
                    );
                    await DB.restoreBackup(currentVersion);
                    throw res.error;
                }
            } else {
                console.log('Error reading update query', updateQuery.error);
                throw updateQuery.error;
            }
        });
    }

    static async makeBackup(): Promise<Result<boolean>> {
        return attemptAsync(async () => {
            throw new Error('Not implemented');
        });
    }

    static async restoreBackup(_version: Version): Promise<Result<boolean>> {
        return attemptAsync(async () => {
            throw new Error('Not implemented');
        });
    }

    static async setIntervals() {
        // backup each day, delete after 30 days
        return attemptAsync(async () => {
            throw new Error('Not implemented');
        });
    }

    static async runAllUpdates() {
        const res = await DB.init();
        if (res.isErr()) {
            console.log('Error initializing database', res.error);
            return;
        }
        const versions = await DB.getUpdates();
        if (versions.isOk()) {
            for (const version of versions.value) {
                if (await DB.hasVersion(version)) {
                    console.log(
                        'Database already has updated to or version',
                        version.join('.'),
                    );
                } else {
                    const res = await DB.runUpdate(version);
                    if (res.isErr()) {
                        console.log(
                            'There was an error updating the database, it may be corrupted. Please restore from backup, edit the update file, then try again.',
                        );
                        break;
                    }
                }
            }
        } else {
            console.log('Error getting updates', versions.error);
        }
    }

    static async getTables(): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            const res = await DB.unsafe.all<{ tableName: string }>(
                `
                -- get all tables available in the env.DATABASE_NAME
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `,
            );

            if (res.isOk()) {
                return res.value.map((r) =>
                    capitalize(toCamelCase(fromSnakeCase(r.tableName)))
                );
            }
            throw res.error;
        });
    }

    static async getTableCols(table: string): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            const res = await DB.unsafe.all<{ columnName: string }>(
                `
                -- get all columns in a table
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = :table
                ORDER BY column_name;
            `,
                { table },
            );

            if (res.isOk()) {
                return res.value.map((r) =>
                    toCamelCase(fromSnakeCase(r.columnName))
                );
            }
            throw res.error;
        });
    }

    // queries
    /**
     * Prepares a query
     *
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @private
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     */
    private static async prepare<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<[string, Queries[T][0]]>> {
        return attemptAsync(async () => {
            const sql = readFileSync('/storage/db/queries/' + type + '.sql');
            if (sql.isOk()) {
                const [parsedQuery, parsedArgs] = DB.parseQuery(
                    sql.value,
                    args,
                );
                return [parsedQuery, parsedArgs] as [string, QParams<T>];
            } else {
                throw new Error('Unable to read query file: ' + type);
            }
        });
    }

    /**
     * Runs a query
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @private
     * @static
     * @template {keyof Queries} T
     * @param {('run' | 'get' | 'all')} type
     * @param {T} query
     * @param {...Queries[T][0]} args
     * @returns {(Queries[T][1] | undefined)}
     */
    private static runQuery<T extends keyof Queries>(
        query: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        return attemptAsync(async () => {
            const q = await DB.prepare(query, ...args);
            if (q.isErr()) {
                error('Error preparing query:', q.error);
                throw q.error;
            }

            const [sql, newArgs] = q.value;

            const result = await DB.db.queryObject(sql, newArgs);
            if (result.warnings.length) {
                log('Database warnings:', result.warnings);
            }

            return DB.parseObj(result.rows) as Queries[T][1][];
        });
    }

    public static async close() {
        log('Closing database...');
        return DB.db.end();
    }

    /**
     * Runs a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {number}
     */
    static async run<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1]>> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value[0];
        });
    }

    /**
     * Gets the first result of a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {(Queries[T][1] | undefined)}
     */
    static get<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1] | undefined>> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value[0];
        });
    }

    /**
     * Gets all results of a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {Queries[T][1][]}
     */
    static all<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value;
        });
    }

    /**
     * Runs a query without preparing it (only used for in-line queries)
     * Don't use this unless you know what you're doing. This should only be used for scripts, and never in the main server.
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @readonly
     * @type {{ run: (query: string, ...args: {}) => number; get: <type = unknown>(query: string, ...args: {}) => any; all: <type>(query: string, ...args: {}) => {}; }}
     */
    static get unsafe() {
        const runUnsafe = async <T = unknown>(
            query: string,
            ...args: Parameter[]
        ): Promise<Result<T[]>> => {
            return attemptAsync(async () => {
                const [q, p] = DB.parseQuery(query, args);
                const result = await DB.db.queryObject(q, p);
                if (result.warnings.length) {
                    log('Database warnings:', result.warnings);
                }
                return DB.parseObj(result.rows) as T[];
            });
        };

        return {
            run: (
                query: string,
                ...args: Parameter[]
            ): Promise<Result<unknown>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value[0];
                });
            },
            get: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type | undefined>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value[0] as type;
                });
            },
            all: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type[]>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value as type[];
                });
            },
        };
    }
}

// when the program exits, close the database
// this is to prevent the database from being locked after the program exits
await DB.connect().then(async (result) => {
    if (result.isOk()) {
        log('Connected to the database');
        await DB.runAllUpdates();
    } else {
        error('FATAL:', result.error);
        error(
            'You may need to ensure that your .env file has the correct database information or you may not be connected to the internet.',
        );
        error('If you believe this is a bug, please report it to the admin');
        Deno.exit(1);
    }
});
// if the program exits, close the database
Deno.addSignalListener('SIGINT', () => {
    DB.close();
});

Deno.addSignalListener('SIGTERM', () => {
    DB.close();
});
