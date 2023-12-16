import { DB } from "../utilities/databases.ts";
import { Status } from "../utilities/status.ts";
import { Permission, RoleName } from "../../shared/db-types.ts";
import { Role as RoleObject } from "../../shared/db-types.ts";
import { Next, ServerFunction } from "./app/app.ts";
import { Req } from "./app/req.ts";
import { Res } from "./app/res.ts";





export default class Role {
    static allowRoles(...role: RoleName[]): ServerFunction<any> {
        return async (req: Req, res: Res, next: Next) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                return res.sendStatus('account:not-logged-in');
            }

            const roles = await account.getRoles();

            if (role.every(r => roles.find((_r: Role) => _r.name === r))) {
                return next();
            } else {
                return res.sendStatus('permissions:unauthorized');
            }
        }
    }

    static fromId(id: string): Role | undefined {
        const r = DB.get('roles/from-id', {
            id
        });
        if (!r) return;
        return new Role(r);
    }


    static fromName(name: string): Role | undefined {
        const r = DB.get('roles/from-name', {
            name
        });
        if (!r) return;
        return new Role(r);
    }

    static all(): Role[] {
        const data = DB.all('roles/all');
        return data.map(d => new Role(d)).sort((a, b) => a.rank - b.rank);
    }

    name: string;
    description: string;
    rank: number;
    id: string;

    constructor(role: RoleObject) {
        this.name = role.name;
        this.description = role.description;
        this.rank = role.rank;
        this.id = role.id;
    }


    getPermissions(): Permission[] {
        const data = DB.all('permissions/from-role', {
            role: this.name
        });
        return data.map(d => d.permission) as Permission[];
    }
}