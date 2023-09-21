
import { __root } from "./env.ts";
import path from 'node:path';
const dbDir = path.resolve(__root, './storage/db');


import { Database, Statement } from "https://deno.land/x/sqlite3@0.8.0/mod.ts";
import { MembershipStatus, Account, Member, Role, AccountRole, RolePermission, Skill } from "../../shared/db-types.ts";



export const MAIN = new Database(path.resolve(dbDir, './main.db'));


type Queries = {
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
    'account/all': [
        [],
        Account
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
        any
    ],
    'account/delete': [
        [{
            id: string
        }],
        any
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
        any
    ],
    'account/verify': [
        [{
            id: string
        }],
        any
    ],
    'account/set-verification': [
        [{
            id: string,
            verification: string
        }],
        any
    ],
    'account/roles': [
        [{
            id: string
        }],
        Role
    ],
    'account/add-role': [
        [{
            id: string,
            role: string
        }],
        any
    ],
    'account/remove-role': [
        [{
            id: string,
            role: string
        }],
        any
    ],
    'account/update-picture': [
        [{
            id: string,
            picture: string
        }],
        any
    ],
    'account/change-username': [
        [{
            id: string,
            username: string
        }],
        any
    ],
    'account/request-email-change': [
        [{
            id: string,
            emailChange: string
        }],
        any
    ],
    'account/change-password': [
        [{
            id: string,
            salt: string,
            key: string,
            passwordChange: null
        }],
        any
    ],
    'account/request-password-change': [
        [{
            id: string,
            passwordChange: string
        }],
        any
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
        any
    ],
    'member/new': [
        [{
            id: string,
            status: MembershipStatus
        }],
        any
    ],
    'member/delete': [
        [{
            id: string
        }],
        any
    ],
    'member/update-bio': [
        [{
            id: string,
            bio: string
        }],
        any
    ],
    'member/update-title': [
        [{
            id: string,
            title: string
        }],
        any
    ],
    'member/update-resume': [
        [{
            id: string,
            resume: string
        }],
        any
    ],
    'member/add-skill': [
        [{
            id: string,
            skill: string,
            years: number
        }],
        any
    ],
    'member/remove-skill': [
        [{
            id: string,
            skill: string
        }],
        any
    ],
    'member/get-skill': [
        [{
            id: string,
            skill: string
        }],
        boolean
    ],
    'member/skills': [
        [{
            id: string
        }],
        Skill
    ],
    'member/add-to-board': [
        [{
            id: string
        }],
        any
    ],
    'member/remove-from-board': [
        [{
            id: string
        }],
        any
    ]
};

const queries: Map<keyof Queries, Statement> = new Map();


const openDir = (dir: string) => {
    const filesAndDirs = Deno.readDirSync(dir);

    for (const f of filesAndDirs) {
        if (f.isDirectory) {
            openDir(path.resolve(dir, f.name));
        } else {
            const file = Deno.readFileSync(path.resolve(dir, f.name));
            
            const decoder = new TextDecoder('utf-8');
            const data = decoder.decode(file);

            const relative = path.relative(
                path.resolve(__root, './storage/db/queries/'), 
                path.resolve(dir, f.name.split('.').slice(0, -1).join('.'))
            );

            queries.set(
                relative as keyof Queries, 
                MAIN.prepare(data)
            );
        }
    }
}


openDir(path.resolve(__root, './storage/db/queries/'));

type Parameter = string | number | boolean | null;

export class DB {
    static run<T extends keyof Queries>(type: T, ...args: Queries[T][0]): number {
        const q = queries.get(type);
        if (!q) throw new Error(`Query ${type} does not exist.`);
        const d = q.run(...args);
        q.finalize();
        return d;
    }

    static get<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1] | undefined {
        const q = queries.get(type);
        if (!q) throw new Error(`Query ${type} does not exist.`);
        // return q.value<Queries[T][1]>(...args) as Queries[T][1];
        return q.get(...args);
    }

    static all<T extends keyof Queries>(type: T, ...args: Queries[T][0]): Queries[T][1][] {
        const q = queries.get(type);
        if (!q) throw new Error(`Query ${type} does not exist.`);
        // return q.values<Queries[T][1]>(...args) as Queries[T][1][];
        const d =  q.all<Record<string, Queries[T][1]>>(...args);
        q.finalize();
        return d;
    }



    static get unsafe() {
        return {
            run: (query: string, ...args: Parameter[]): number => {
                const q = MAIN.prepare(query);
                const d = q.run(...args);
                q.finalize();
                return d;
            },
            get: (query: string, ...args: Parameter[]) => {
                const q = MAIN.prepare(query);
                const d = q.get(...args);
                q.finalize();
                return d;
            },
            all: (query: string, ...args: Parameter[]) => {
                const q = MAIN.prepare(query);
                const d = q.all(...args);
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