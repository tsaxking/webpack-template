
import { __root } from "./env.ts";
import path from 'node:path';
import { Database, Statement } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { MembershipStatus, Account, Member, Role, AccountRole, RolePermission, Skill } from "../../shared/db-types.ts";
import { log } from "./terminal-logging.ts";
import { SessionObj } from "../structure/sessions.ts";

const dbDir = path.resolve(__root, './storage/db');
export const MAIN = new Database(path.resolve(dbDir, './sfz.db'));


type Queries = {
    'sessions/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'sessions/delete-all': [
        [],
        unknown
    ],
    'sessions/update': [
        [{
            id: string,
            ip: string,
            latestActivity: number,
            accountId: string,
            userAgent: string,
            requests: number,
            created: number,
            prevUrl: string
        }],
        unknown
    ],
    'sessions/all': [
        [],
        SessionObj
    ],
    'sessions/get': [
        [{
            id: string
        }],
        SessionObj
    ],
    'sessions/new': [
        [{
            id: string,
            ip: string,
            latestActivity: number,
            accountId: string,
            userAgent: string,
            prevUrl: string,
            requests: number,
            created: number
        }],
        unknown
    ],
    'db/get-version': [
        [],
        {
            version: number
        }
    ],
    'roles/from-id': [
        [{
            id: string
        }],
        Role
    ],
    'roles/from-name': [
        [{
            name: string
        }],
        Role
    ],
    'roles/all': [
        [],
        Role
    ],
    'permissions/from-role': [
        [{
            role: string
        }],
        RolePermission
    ],
    'account/from-username': [
        [{
            username: string
        }],
        Account
    ],
    'account/from-email': [
        [{
            email: string
        }],
        Account
    ],
    'account/from-verification-key': [
        [{
            verification: string
        }],
        Account
    ],
    'account/from-password-change': [
        [{
            passwordChange: string
        }],
        Account
    ],
    'account/unverified': [
        [],
        Account
    ],
    'account/all': [
        [],
        Account
    ],
    'account/change-first-name': [
        [{
            id: string,
            firstName: string
        }],
        unknown
    ],
    'account/change-last-name': [
        [{
            id: string,
            lastName: string
        }],
        unknown
    ],
    'account/new': [
        [{
            id: string,
            username: string,
            key: string,
            salt: string,
            firstName: string,
            lastName: string,
            email: string,
            verified: 0 | 1,
            verification: string,
            created: number,
            phoneNumber: string
        }],
        unknown
    ],
    'account/unverify': [
        [{
            id: string
        }],
        unknown
    ],
    'account/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'account/from-id': [
        [{ 
            id: string
        }],
        Account
    ],
    'account/change-email': [
        [{
            id: string,
            email: string
        }],
        unknown
    ],
    'account/verify': [
        [{
            id: string
        }],
        unknown
    ],
    'account/set-verification': [
        [{
            id: string,
            verification: string
        }],
        unknown
    ],
    'account/roles': [
        [{
            accountId: string
        }],
        Role
    ],
    'account/add-role': [
        [{
            accountId: string,
            roleId: string
        }],
        unknown
    ],
    'account/remove-role': [
        [{
            accountId: string,
            roleId: string
        }],
        unknown
    ],
    'account/update-picture': [
        [{
            id: string,
            picture: string
        }],
        unknown
    ],
    'account/change-username': [
        [{
            id: string,
            username: string
        }],
        unknown
    ],
    'account/request-email-change': [
        [{
            id: string,
            emailChange: string
        }],
        unknown
    ],
    'account/change-password': [
        [{
            id: string,
            salt: string,
            key: string,
            passwordChange: null
        }],
        unknown
    ],
    'account/request-password-change': [
        [{
            id: string,
            passwordChange: string
        }],
        unknown
    ],
    'member/from-username': [
        [{
            username: string
        }],
        Member
    ],
    'member/all': [
        [],
        Member
    ],
    'member/update-status': [
        [{
            status: MembershipStatus,
            id: string
        }],
        unknown
    ],
    'member/new': [
        [{
            id: string,
            status: MembershipStatus
        }],
        unknown
    ],
    'member/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'member/update-bio': [
        [{
            id: string,
            bio: string
        }],
        unknown
    ],
    'member/update-title': [
        [{
            id: string,
            title: string
        }],
        unknown
    ],
    'member/update-resume': [
        [{
            id: string,
            resume: string
        }],
        unknown
    ],
    'member/add-to-board': [
        [{
            id: string
        }],
        unknown
    ],
    'member/remove-from-board': [
        [{
            id: string
        }],
        unknown
    ],
    'member/get-skill': [
        [{
            id: string;
            skill: string;
        }],
        Skill
    ],
    'member/add-skill': [
        [{
            id: string;
            skill: string;
            years: number;
        }],
        unknown
    ],
    'member/remove-skill': [
        [{
            id: string;
            skill: string;
        }],
        unknown
    ],
    'member/skills': [
        [{
            id: string;
        }],
        Skill
    ],
};






type Parameter = string | number | boolean | null;

export class DB {
    private static prepare<T extends keyof Queries>(type: T): Statement {
        try {
            const data = Deno.readFileSync(path.resolve(__root, './storage/db/queries/', type + '.sql'));
            const sql = new TextDecoder('utf-8').decode(data);

            return MAIN.prepare(sql);
        } catch (err) {
            throw new Error('Could not find query: ' + type);
        }
    }


    static get path() {
        return path.resolve(dbDir, './main.db');
    }

    static run<T extends keyof Queries>(type: T, ...args: Queries[T][0]): number {
        const q = DB.prepare(type);
        let d: number;
        try {
            d = q.run(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        q.finalize();
        return d;
    }

    static get<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1] | undefined {
        const q = DB.prepare(type);
        let d: Queries[T][1] | undefined;
        try {
            d = q.get(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        return d;
    }

    static all<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1][] {
        const q = DB.prepare(type);
        let d: Queries[T][1][];
        try {
            d = q.all(...args);
        } catch (e) {
            log('Error in query', type);
            throw e;
        }
        q.finalize();
        return d;
    }



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
                q.finalize();
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
                q.finalize();
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
                q.finalize();
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
