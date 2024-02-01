import { DB } from '../utilities/databases.ts';
import { RolePermission } from '../../shared/db-types.ts';
import { Permission, RoleName } from '../../shared/permissions.ts';
import { Role as RoleObject } from '../../shared/db-types.ts';
import { ServerFunction } from './app/app.ts';
import { uuid } from '../utilities/uuid.ts';

/**
 * Role object, contains permission information and role name
 * @date 1/9/2024 - 12:48:41 PM
 *
 * @export
 * @class Role
 * @typedef {Role}
 */
export default class Role {
    /**
     * Creates a middleware function that checks if the user has the specified role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @param {...RoleName[]} role
     * @returns {ServerFunction<any>}
     */
    static allowRoles(...role: RoleName[]): ServerFunction {
        return async (req, res, next) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                return res.sendStatus('account:not-logged-in');
            }

            const { roles } = account;

            if (role.every((r) => roles.find((_r: Role) => _r.name === r))) {
                return next();
            } else {
                return res.sendStatus('permissions:unauthorized');
            }
        };
    }

    /**
     * Prevents users with the specified role from accessing the path
     * @date 1/9/2024 - 12:49:45 PM
     *
     * @static
     * @param {...RoleName[]} role
     * @returns {ServerFunction<any>}
     */
    static preventRoles(...role: RoleName[]): ServerFunction {
        return async (req, res, next) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                return res.sendStatus('account:not-logged-in');
            }

            const { roles } = account;

            if (role.some((r) => roles.find((_r: Role) => _r.name === r))) {
                return res.sendStatus('permissions:unauthorized');
            } else {
                return next();
            }
        };
    }

    static get allPermissions(): Permission[] {
        return DB.all('permissions/all').map(
            (p: RolePermission) => p.permission as Permission,
        );
    }

    /**
     * Retrieves a role from the database given its uuid
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @param {string} id
     * @returns {(Role | undefined)}
     */
    static fromId(id: string): Role | undefined {
        const r = DB.get('roles/from-id', {
            id,
        });
        if (!r) return;
        return new Role(r);
    }

    /**
     * Retrieves a role from the database given its name
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @param {string} name
     * @returns {(Role | undefined)}
     */
    static fromName(name: string): Role | undefined {
        const r = DB.get('roles/from-name', {
            name,
        });
        if (!r) return;
        return new Role(r);
    }

    /**
     * Retrieves all roles from the database
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @returns {Role[]}
     */
    static all(): Role[] {
        const data = DB.all('roles/all');
        return data
            .map((d: RoleObject) => new Role(d))
            .sort((a: Role, b: Role) => a.rank - b.rank);
    }

    static new(name: string, description: string, rank: number): Role {
        const id = uuid();
        DB.run('roles/new', {
            name,
            description,
            id,
            rank,
        });
        return new Role({
            name,
            description,
            id,
            rank,
        });
    }

    /**
     * The name of the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {string}
     */
    readonly name: string;
    /**
     * Description of the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {string}
     */
    readonly description: string;
    /**
     * Rank of the role (higher rank = fewer permissions)
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {number}
     */
    readonly rank: number;
    /**
     * The uuid of the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {string}
     */
    readonly id: string;

    /**
     * Creates an instance of Role.
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @constructor
     * @param {RoleObject} role
     */
    constructor(role: RoleObject) {
        this.name = role.name;
        this.description = role.description;
        this.rank = role.rank;
        this.id = role.id;
    }

    /**
     * Retrieves all permission objects for the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @returns {Permission[]}
     */
    getPermissions(): Permission[] {
        const data = DB.all('permissions/from-role', {
            roleId: this.id,
        });
        return data.map((d: RolePermission) => d.permission) as Permission[];
    }

    addPermission(permission: Permission) {
        DB.run('permissions/add-to-role', {
            permission,
            roleId: this.id,
        });
    }

    removePermission(permission: Permission) {
        DB.run('permissions/remove-from-role', {
            roleId: this.id,
            permission,
        });
    }

    delete() {
        DB.run('roles/delete', {
            id: this.id,
        });
    }
}
