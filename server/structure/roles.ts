import { NextFunction, Request, Response } from "npm:express";
import { DB } from "../utilities/databases.ts";
import { Status } from "../utilities/status.ts";
import { Permission, RoleName } from "../../shared/db-types.ts";


type RoleObject = {
    name: string;
    description: string;
    rank: number;
}





export default class Role {
    static allowRoles(...role: RoleName[]): NextFunction {
        const fn = async (req: Request, res: Response, next: NextFunction) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                return Status.from('account.notLoggedIn', req).send(res);
            }

            const roles = await account.getRoles();

            if (role.every(r => roles.find((_r: Role) => _r.name === r))) {
                return next();
            } else {
                const s = Status.from('roles.invalid', req);
                return s.send(res);
            }
        }

        return fn as unknown as NextFunction;
    }




    static fromName(name: string): Role | undefined {
        const r = DB.get('roles/from-name', {
            name
        });
        if (!r) return;
        return new Role(r);
    }

    static async all(): Promise<Role[]> {
        const data = await DB.all('roles/all');
        return data.map(d => new Role(d)).sort((a, b) => a.rank - b.rank);
    }

    name: string;
    description: string;
    rank: number;

    constructor(role: RoleObject) {
        this.name = role.name;
        this.description = role.description;
        this.rank = role.rank;
    }


    async getPermissions(): Promise<Permission[]> {
        const data = await DB.all('permissions/from-role', {
            role: this.name
        });
        return data.map(d => d.permission) as Permission[];
    }
}