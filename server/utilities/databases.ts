import env, { __root } from './env.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { error, log } from './terminal-logging.ts';
import { Queries } from './sql-types.ts';
import { readFileSync } from './files.ts';
import { attemptAsync, Result } from '../../shared/check.ts';

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
type Parameter = string | number | boolean | null | {
    [key: string]: string | number | boolean | null;
};

type QParams<T extends keyof Queries> = Queries[T][0];

/**
 * Database class
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @export
 * @class DB
 * @typedef {DB}
 */
export class DB {
    // TODO: set up parsing, if necessary
    private static parse(
        query: string,
        args: Parameter[],
    ): [string, Parameter[]] {
        // get every :variable in the query
        const matches = query.match(/:\w+/g);
        const newArgs: Parameter[] = [];
        if (matches) {
            // for each match, replace it with a $n
            for (let i = 0; i < matches.length; i++) {
                query = query.replaceAll(matches[i], `$${i + 1}`);
                newArgs.push(
                    args[0] ? args[0][matches[i].replace(/:/g, '')] : args[i],
                );
            }
            return [query, newArgs];
        }

        return [query, args];
    }

    private static version?: [number, number, number];

    static async getVersion(): Promise<[number, number, number]> {
        if (DB.version) return DB.version;

        const v = await DB.get('db/get-version');
        if (v.isOk() && v.value) {
            const { major, minor, patch } = v.value;
            return [major, minor, patch];
        }
        // database is not initialized
        return [0, 0, 0];
    }

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
            return DB.db.connect();
        });
    }

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
        ...args: QParams<T>
    ): Promise<Result<[string, Queries[T][0]]>> {
        return attemptAsync(async () => {
            const sql = readFileSync('/storage/db/queries/' + type + '.sql');
            if (sql.isOk()) {
                // TODO: may need to do some type checking and parsing here
                // This will likely parse the sql's :variable into $1, $2, etc. or ? for postgres to use
                return [sql.value, args] as [string, QParams<T>];
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
        ...args: QParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        return attemptAsync(async () => {
            const q = await DB.prepare(query, ...args);
            if (q.isErr()) throw q.error;

            const [sql, newArgs] = q.value;
            const result = await DB.db.queryObject(sql, ...newArgs);
            if (result.warnings.length) {
                log('Database warnings:', result.warnings);
            }

            return result.rows;
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
        ...args: QParams<T>
    ): Promise<Queries[T][1]> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) throw q.error;
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
        ...args: QParams<T>
    ): Promise<Result<Queries[T][1] | undefined>> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) throw q.error;
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
        ...args: QParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        return attemptAsync(async () => {
            const q = await DB.runQuery(type, ...args);
            if (q.isErr()) throw q.error;
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
                const [q, p] = DB.parse(query, args);
                const result = await DB.db.queryObject(q, p);
                if (result.warnings.length) {
                    log('Database warnings:', result.warnings);
                }
                return result.rows as T[];
            });
        };

        return {
            run: (
                query: string,
                ...args: Parameter[]
            ): Promise<Result<unknown>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) throw r.error;
                    return r.value[0];
                });
            },
            get: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type | undefined>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) throw r.error;
                    return r.value[0] as type;
                });
            },
            all: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type[]>> => {
                return attemptAsync(async () => {
                    const r = await runUnsafe(query, ...args);
                    if (r.isErr()) throw r.error;
                    return r.value as type[];
                });
            },
        };
    }
}

// when the program exits, close the database
// this is to prevent the database from being locked after the program exits

await DB.connect()
    .then((result) => {
        if (result.isOk()) {
            log('Connected to the database');
        } else {
            error('FATAL:', result.error);
            error(
                'You may need to ensure that your .env file has the correct database information or you may not be connected to the internet.',
            );
            error(
                'If you believe this is a bug, please report it to the admin',
            );
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
