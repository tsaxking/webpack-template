
import env, { __root } from "./env.ts";
import path from 'node:path';
import { Database, Statement } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { log } from "./terminal-logging.ts";
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
            throw new Error('Could not find query: ' + type);
        }
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
        const q = DB.prepare(type);
        let d: number;
        try {
            d = q.run(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        // q.finalize();
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
     * @returns {(Queries[T][1] | undefined)}
     */
    static get<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1] | undefined {
        const q = DB.prepare(type);
        let d: Queries[T][1] | undefined;
        try {
            d = q.get(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        // q.finalize();
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
     * @returns {Queries[T][1][]}
     */
    static all<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1][] {
        const q = DB.prepare(type);
        let d: Queries[T][1][];
        try {
            d = q.all(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        // q.finalize();
        return d;
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
                const q = MAIN.prepare(query);
                let d: number;
                try {
                    d = q.run(...args);
                } catch (e) {
                    log('Error in query', query);
                    throw e;
                }
                // q.finalize();
                return d;
            },
            get: <type = unknown>(query: string, ...args: Parameter[]) => {
                const q = MAIN.prepare(query);
                let d: Record<string, type> | undefined;
                try {
                    d = q.get<Record<string, type>>(...args);
                } catch (e) {
                    log('Error in query', query);
                    throw e;
                }
                // q.finalize();
                return d;
            },
            all: <type>(query: string, ...args: Parameter[]) => {
                const q = MAIN.prepare(query);
                let d: Record<string, type>[];
                try {
                    d = q.all<Record<string, type>>(...args);
                } catch (e) {
                    log('Error in query', query);
                    throw e;
                }
                // q.finalize();
                return d;
            }
        }
    }
}


// when the program exits, close the database
// this is to prevent the database from being locked

globalThis.addEventListener('unload', () => {
    MAIN.close();
});