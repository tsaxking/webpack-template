import env, { __root, resolve } from './env.ts';
import { Database, Statement } from 'https://deno.land/x/sqlite3@0.9.1/mod.ts';
import { error, log } from './terminal-logging.ts';
import { Queries } from './sql-types.ts';

/**
 * The name of the main database
 * @date 1/9/2024 - 12:08:08 PM
 *
 * @type {*}
 */
const { DATABASE_LINK } = env;

/**
 * Directory where the databases are stored
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @type {*}
 */
const dbDir = resolve(__root, './storage/db');
/**
 * Main database
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @type {Database}
 */
export const MAIN = new Database(resolve(dbDir, DATABASE_LINK + '.db'));

/**
 * Acceptable types for a parameter
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @typedef {Parameter}
 */
type Parameter = string | number | boolean | null;

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
    static readonly db = MAIN;

    /**
     * Path to the database
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static get path() {
        return resolve(dbDir, env.DATABASE_LINK + '.db');
    }

    /**
     * Database version
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @static
     * @readonly
     * @type {[number, number, number]}
     */
    static get version(): [number, number, number] {
        const v = DB.get('db/get-version');
        return [v?.major ?? 0, v?.minor ?? 0, v?.patch ?? 0];
    }


    /**
     * Checks if the database has a version
     *
     * @static
     * @param {[number, number, number]} v
     * @returns {boolean}
     */
    static hasVersion(v: [number, number, number]) {
        const [M, m, p] = v;
        const [M2, m2, p2] = DB.version;

        return M2 >= M && m2 >= m && p2 >= p;
    }

    /**
     * Checks if the database is a specific version
     *
     * @static
     * @param {[number, number, number]} v
     * @returns {boolean}
     */
    static isVersion(v: [number, number, number]) {
        return DB.version.join('.') === v.join('.');
    }

    /**
     * Prepares a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @private
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @returns {Statement}
     */
    private static prepare<T extends keyof Queries>(type: T): Statement {
        try {
            const data = Deno.readFileSync(
                resolve(__root, './storage/db/queries/', String(type) + '.sql'),
            );
            const sql = new TextDecoder('utf-8').decode(data);

            return MAIN.prepare(sql);
        } catch (err) {
            error('Error preparing query:', type, err);
            throw new Error(
                'Database error, above error was thrown when preparing query',
            );
        }
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
        type: 'run' | 'get' | 'all',
        query: T,
        ...args: Queries[T][0]
    ): Queries[T][1] | undefined {
        const q = DB.prepare(query);

        const recurse = (i: number) => {
            if (i > 10) {
                throw new Error(
                    'Attempted to run the query 10 times, all failed',
                );
            }
            try {
                return q[type](...args);
            } catch (error) {
                if (error.message.includes('database is locked')) {
                    return setTimeout(() => recurse(i + 1));
                } else {
                    throw error;
                }
            }
        };

        let d: Queries[T][1] | Queries[T][1][] | number | undefined;
        try {
            d = recurse(0);
        } catch (e) {
            log('Error in query', query);
            throw e; // want to throw the error because it's a database error
        }
        return d;
    }

    /**
     * Runs a query without preparing it (only used for in-line queries)
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @private
     * @static
     * @param {('run' | 'get' | 'all')} type
     * @param {string} query
     * @param {...Parameter[]} args
     * @returns {unknown}
     */
    private static runUnsafeQuery(
        type: 'run' | 'get' | 'all',
        query: string,
        ...args: Parameter[]
    ) {
        const q = MAIN.prepare(query);

        const recurse = (i: number) => {
            if (i > 10) {
                throw new Error(
                    'Attempted to run the query 10 times, all failed',
                );
            }
            try {
                return q[type](...args);
            } catch (error) {
                if (error.message.includes('database is locked')) {
                    // wait until the event loop is free
                    return setTimeout(() => recurse(i + 1));
                } else {
                    throw error;
                }
            }
        };

        let d: unknown;
        try {
            d = recurse(0);
        } catch (e) {
            log('Error in query', query);
            throw e;
        }
        return d;
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
    static run<T extends keyof Queries>(
        type: T,
        ...args: Queries[T][0]
    ): number {
        return DB.runQuery('run', type, ...args) as number;
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
        ...args: Queries[T][0]
    ): Queries[T][1] | undefined {
        return DB.runQuery('get', type, ...args);
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
        ...args: Queries[T][0]
    ): Queries[T][1][] {
        return DB.runQuery('all', type, ...args) as Queries[T][1][];
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
            run: (query: string, ...args: Parameter[]): number => {
                return DB.runUnsafeQuery('run', query, ...args) as number;
            },
            get: <type = unknown>(query: string, ...args: Parameter[]) => {
                return DB.runUnsafeQuery('get', query, ...args) as type;
            },
            all: <type = unknown>(query: string, ...args: Parameter[]) => {
                return DB.runUnsafeQuery('all', query, ...args) as type[];
            },
        };
    }
}

// when the program exits, close the database
// this is to prevent the database from being locked after the program exits

globalThis.addEventListener('unload', () => {
    MAIN.close();
});
