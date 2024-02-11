import env, { __root } from './env.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { error, log } from './terminal-logging.ts';
import { Queries } from './queries.ts';
import { exists, readDir, readFile, readFileSync, saveFile } from './files.ts';
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
import { bigIntDecode, bigIntEncode } from '../../shared/objects.ts';
import { daysTimeout } from '../../shared/sleep.ts';

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

type QueryResult<T> = {
    rows: T[];
    query: string;
    params: unknown[];
};

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

    private static connected = false;

    static async connect() {
        return attemptAsync(async () => {
            if (DB.connected) await DB.disconnect();
            return new Promise((res, rej) => {
                setTimeout(() => {
                    rej('Database connection timed out');
                }, 20 * 1000);
                DB.db
                    .connect()
                    .then(() => {
                        DB.connected = true;
                        res('Connected to the database');
                    })
                    .catch(() => {
                        rej('Error connecting to the database');
                    });
            });
        });
    }

    public static parseQuery(
        query: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: any[],
    ): [string, Parameter[]] {
        const copied = [...args]; // no dependencies

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
        // console.log(matches);
        const newArgs: Parameter[] = [];
        if (matches) {
            // for each match, replace it with a $n
            for (let i = 0; i < matches.length; i++) {
                query = query.replace(matches[i], `$${i + 1}`);
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

    static async getVersion(): Promise<Version> {
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

        const deleteVersion = await DB.run('db/delete-version');
        if (deleteVersion.isErr()) throw deleteVersion.error;

        const res = await DB.run('db/change-version', {
            major,
            minor,
            patch,
        });

        if (res.isErr()) console.log('Error setting version', res.error);
        return res;
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
                const b = await DB.makeBackup();
                if (b.isErr()) throw b.error;

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
                            await DB.restoreBackup(b.value);
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
                    await DB.restoreBackup(b.value);
                    throw res.error;
                }
            } else {
                console.log('Error reading update query', updateQuery.error);
                throw updateQuery.error;
            }
        });
    }

    static async getBackups(): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            const backups = await readDir('storage/db/backups');
            if (backups.isOk()) {
                return backups.value.map((b) => b.name);
            }
            return [];
        });
    }

    static async makeBackup(): Promise<Result<string>> {
        return attemptAsync(async () => {
            const [tables, version] = await Promise.all([
                DB.getTables(),
                DB.getVersion(),
            ]);

            // if (['0.0.0', '-1.-1.-1'].includes(version.join('.'))) {
            //     console.log('Database not initialized');
            //     throw new Error('Database not initialized');
            // }

            if (tables.isErr()) throw tables.error;
            const backup: {
                [table: string]: unknown[]; // table name: rows
            } = {};

            // pull all data from each table
            await Promise.all(
                tables.value.map(async (table) => {
                    const data = await DB.unsafe.all(`SELECT * FROM ${table}`);
                    if (data.isOk()) backup[table] = data.value;
                    else throw data.error;
                }),
            );

            const copy = bigIntEncode(backup);
            const str = JSON.stringify(copy, null, 2);
            const name = `${version.join('-')}_${Date.now()}.json`;

            const res = await saveFile('storage/db/backups/' + name, str);
            if (res.isOk()) {
                console.log('Backup created:', name);
                return name;
            } else {
                console.log('Error creating backup', res.error);
                throw res.error;
            }
        });
    }

    static async reset(): Promise<Result<string>> {
        return attemptAsync(async () => {
            let b = await DB.makeBackup();
            if (b.isErr()) {
                if (b.error.message.includes('not initialized')) {
                    b = b.handle('0.0.0_0.json');
                } else {
                    throw b.error;
                }
            }

            const tables = await DB.getTables();
            if (tables.isErr()) throw tables.error;
            const res = await Promise.all(
                tables.value.map((table) =>
                    DB.unsafe.run(`DROP TABLE ${table};`)
                ),
            );

            if (res.every((r) => r.isOk())) {
                console.log('Database reset');
                return b.value;
            } else {
                console.log('Error(s) resetting database', res);
                throw new Error('Error(s) resetting database');
            }
        });
    }

    static async restoreBackup(backupName: string): Promise<Result<void>> {
        return attemptAsync(async () => {
            const currentVersion = await DB.getVersion();
            const backupRes = await DB.makeBackup();
            if (backupRes.isErr()) throw backupRes.error;

            const resetRes = await DB.reset();
            if (resetRes.isErr()) {
                console.log('Error resetting database', resetRes.error);
                console.log(
                    'Reinitializing database, and restoring its current version...',
                );

                const updateRes = await DB.updateToVersion(currentVersion);
                if (updateRes.isErr()) throw updateRes.error;
                const restoreRes = await this.restoreBackup(backupRes.value);
                if (restoreRes.isErr()) throw restoreRes.error;
                throw resetRes.error;
            }

            const version = backupName.split('_')[0].split('-').map(Number) as [
                number,
                number,
                number,
            ];
            const updateRes = await DB.updateToVersion(version);
            if (updateRes.isErr()) throw updateRes.error;
            console.log('Update successful');

            const versionNow = await DB.getVersion();
            console.log('Version after updates:', versionNow.join('.'));

            const ts = await DB.getTables();
            if (ts.isOk()) console.log('Tables after updates:', ts.value);

            const file = await readFile(`storage/db/backups/${backupName}`);
            if (file.isErr()) throw file.error;

            const data = bigIntDecode(JSON.parse(file.value)) as {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [table: string]: any[];
            };

            const tables = Object.keys(data);

            console.log('Inserting...', tables);
            const res = await Promise.all(
                tables.map(async (table) => {
                    const res = await attemptAsync(async () => {
                        const rows = data[table];
                        const cols = Object.keys(rows[0] || {});
                        if (!cols.length) return; // no data to insert

                        const colNames = cols.join(', ');
                        const colVals = cols.map((c) => `:${c}`).join(', ');

                        return Promise.all(
                            rows.map(async (r) => {
                                const q =
                                    `INSERT INTO ${table} (${colNames}) VALUES (${colVals})`;
                                const res = await DB.unsafe.run(q, r);

                                if (res.isErr()) {
                                    console.error(
                                        'Error inserting data into',
                                        table,
                                        res.error,
                                        q,
                                        r,
                                    );
                                }

                                return res;
                            }),
                        );
                    });

                    if (res.isErr()) throw res.error;
                    if (res.value?.some((r) => r.isErr())) {
                        console.error('Error inserting data');
                        throw new Error('Error inserting data');
                    }
                    return res;
                }),
            );

            if (res.every((r) => r.isOk())) {
                console.log('Database restored');
            } else {
                // console.log('Error(s) restoring database', res);
                throw new Error('Error(s) restoring database');
            }
        });
    }

    static async setIntervals() {
        const { BACKUP_INTERVAL, BACKUP_DAYS } = env;
        if (!BACKUP_INTERVAL || !BACKUP_DAYS) {
            console.log(
                'BACKUP_INTERVAL or BACKUP_DAYS not set, skipping backup intervals',
            );
            return;
        }
        const now = Date.now();

        console.log(
            'Setting backup intervals to create every',
            BACKUP_INTERVAL,
            'hours, and delete after',
            BACKUP_DAYS,
            'days',
        );

        // backup each day, delete after 30 days
        return attemptAsync(async () => {
            const backups = await DB.getBackups();
            if (backups.isErr()) throw new Error('Could not find backups');

            console.log(
                'Setting backup intervals to delete every',
                BACKUP_DAYS,
                'days',
            );

            const deleteAfter = (backup: string, days: number) => {
                daysTimeout(() => {
                    console.log('Deleting backup:', backup);
                    Deno.remove(`storage/db/backups/${backup}`);
                }, days);
            };

            // creates a backup every BACKUP_INTERVAL hours
            setInterval(
                async () => {
                    console.log('Creating automated database backup...');
                    const res = await DB.makeBackup();
                    if (res.isOk()) {
                        deleteAfter(res.value, +BACKUP_DAYS);
                    } else {
                        console.log('Error creating backup', res.error);
                    }
                },
                +BACKUP_INTERVAL * 60 * 60 * 1000,
            );

            for (const b of backups.value) {
                const [, time] = b.split('_');
                const date = new Date(+time.split('.')[0]);
                const deleteDate = new Date(+time.split('.')[0]).setDate(
                    date.getDate() + +BACKUP_DAYS,
                );

                if (deleteDate < now) {
                    console.log('Deleting backup:', b);
                    await Deno.remove(`storage/db/backups/${b}`);
                } else {
                    deleteAfter(b, +BACKUP_DAYS);
                }
            }
        });
    }

    static async updateToVersion(version: Version): Promise<Result<void>> {
        return attemptAsync(async () => {
            const versions = await DB.getUpdates();
            if (versions.isErr()) throw versions.error;
            await DB.init();

            const [major, minor, patch] = version;

            for (const v of versions.value) {
                const [M, m, p] = v;
                if (
                    M < major ||
                    (M === major && m < minor) ||
                    (M === major && m === minor && p <= patch)
                ) {
                    const res = await DB.runUpdate(v);
                    if (res.isErr()) throw res.error;
                }
            }
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
    ): Promise<Result<[string, Parameter[]]>> {
        return attemptAsync(async () => {
            const sql = readFileSync('/storage/db/queries/' + type + '.sql');
            if (sql.isOk()) {
                const [parsedQuery, parsedArgs] = DB.parseQuery(
                    sql.value,
                    args,
                );
                return [parsedQuery, parsedArgs] as [string, Parameter[]];
            } else {
                throw new Error('Unable to read query file: ' + type);
            }
        });
    }

    private static async runQuery(
        query: string,
        args: Parameter[],
    ): Promise<Result<QueryResult<unknown>>> {
        const run = () =>
            attemptAsync(async () => {
                const q = DB.parseQuery(query, args);
                const [sql, newArgs] = q;

                const result = await DB.db.queryObject(sql, newArgs);
                if (result.warnings.length) {
                    log('Database warnings:', result.warnings);
                }

                return {
                    rows: DB.parseObj(result.rows) as unknown[],
                    params: newArgs,
                    query: sql,
                };
            });

        let res = await run();
        let maxRetries = 5;
        const disconnectedErrors = [
            'Connection terminated',
            'Connection lost',
            'Broken pipe',
            'Connection closed',
        ];

        while (res.isErr() && maxRetries > 0) {
            const { error } = res;
            if (disconnectedErrors.some((e) => error.message.includes(e))) {
                log('Database disconnected, reconnecting...');
                await DB.connect();
            }
            res = await run();
            maxRetries--;
        }

        if (res.isErr()) {
            error('Error running query:', res.error);
        }

        return res;
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
    private static pipeSafe<T extends keyof Queries>(
        query: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<QueryResult<Queries[T][1]>>> {
        return attemptAsync(async () => {
            const q = await DB.prepare(query, ...args);
            if (q.isErr()) {
                error('Error preparing query:', q.error);
                throw q.error;
            }

            const [newQuery, newArgs] = q.value;
            const result = await DB.runQuery(newQuery, newArgs);

            if (result.isErr()) {
                throw result.error;
            }

            return result.value;
        });
    }

    static async pipeUnsafe<T = unknown>(
        query: string,
        ...args: Parameter[]
    ): Promise<Result<QueryResult<T>>> {
        return attemptAsync(async () => {
            const [q, p] = DB.parseQuery(query, args);

            const result = await DB.runQuery(q, p);

            if (result.isErr()) {
                throw result.error;
            }

            return result.value as QueryResult<T>;
        });
    }

    public static async disconnect() {
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
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value.rows[0];
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
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value.rows[0];
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
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                console.error(q.error);
                throw q.error;
            }
            return q.value.rows;
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
        return {
            run: (
                query: string,
                ...args: Parameter[]
            ): Promise<Result<unknown>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value.rows[0];
                });
            },
            get: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type | undefined>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value.rows[0] as type;
                });
            },
            all: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type[]>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        console.error(r.error);
                        throw r.error;
                    }
                    return r.value.rows as type[];
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
        await DB.makeBackup();
        await DB.setIntervals();
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
    DB.disconnect();
});
