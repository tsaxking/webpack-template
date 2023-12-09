
import env, { __root } from "./env.ts";
import path from 'node:path';
import { Database, Statement } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { log, error } from "./terminal-logging.ts";
import { Queries } from "./sql-types.ts";

const { DATABASE_LINK } = env;

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @type {*}
 */
const dbDir = path.resolve(__root, './storage/db');
/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @type {Database}
 */
export const MAIN = new Database(path.resolve(dbDir, DATABASE_LINK + '.db'));



/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @typedef {Parameter}
 */
type Parameter = string | number | boolean | null;

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @export
 * @class DB
 * @typedef {DB}
 */
export class DB {
    static readonly db = MAIN;

    static get path() {
        console.log(env);
        return path.resolve(dbDir, env.DATABASE_LINK + '.db');
    }

    static get version(): [number, number, number] {
        const v = DB.get('db/get-version');
        return [v?.major ?? 0, v?.minor ?? 0, v?.patch ?? 0];
    }

    /**
     * Description placeholder
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
            const data = Deno.readFileSync(path.resolve(__root, './storage/db/queries/', type + '.sql'));
            const sql = new TextDecoder('utf-8').decode(data);

            return MAIN.prepare(sql);
        } catch (err) {
            error('Error preparing query:', type, err);
            throw new Error('Database error, above error was thrown when preparing query');
        }
    }

    private static runQuery<T extends keyof Queries>(type: 'run' | 'get' | 'all', query: T, ...args: Queries[T][0]): Queries[T][1] | undefined {
        const q = DB.prepare(query);

        const recurse = (i: number) => {
            if (i > 10) throw new Error('Attempted to run the query 10 times, all failed');
            try {
                return q[type](...args);
            } catch (error) {
                if (error.message.includes('database is locked')) {
                    return setTimeout(() => recurse(i + 1));
                } else {
                    throw error;
                }
            }
        }

        let d: Queries[T][1] | Queries[T][1][] | number | undefined;
        try {
            d = recurse(0);
        } catch (e) {
            log('Error in query', query);
            throw e;
        }
        return d;
    }

    private static runUnsafeQuery(type: 'run' | 'get' | 'all', query: string, ...args: Parameter[]) {
        const q = MAIN.prepare(query);

        const recurse = (i: number) => {
            if (i > 10) throw new Error('Attempted to run the query 10 times, all failed');
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
        }

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
     * Description placeholder
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {number}
     */
    static run<T extends keyof Queries>(type: T, ...args: Queries[T][0]): number {
        return DB.runQuery('run', type, ...args) as number;
    }

    /**
     * Description placeholder
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {(Queries[T][1] | undefined)}
     */
    static get<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1] | undefined {
        return DB.runQuery('get', type, ...args);
    }

    /**
     * Description placeholder
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {Queries[T][1][]}
     */
    static all<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1][] {
        return DB.runQuery('all', type, ...args) as Queries[T][1][];
    }



    /**
     * Description placeholder
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
            }
        }
    }
}


// when the program exits, close the database
// this is to prevent the database from being locked

globalThis.addEventListener('unload', () => {
    MAIN.close();
});