import { DB } from '../utilities/databases';
import { RolePermission } from '../../shared/db-types';
import { Role as RoleObject } from '../../shared/db-types';
import { ServerFunction } from './app/app';
import { uuid } from '../utilities/uuid';

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
     * @deprecated
     */
    static allowRoles(..._role: never[]): ServerFunction {
        return async (_req, _res, _next) => {
            throw new Error(
                'This method is deprecated, use Account.allowPermissions() instead'
            );
        };
    }

    /**
     * Prevents users with the specified role from accessing the path
     * @date 1/9/2024 - 12:49:45 PM
     *
     * @static
     * @param {...RoleName[]} role
     * @returns {ServerFunction<any>}
     * @deprecated
     */
    static preventRoles(..._role: never[]): ServerFunction {
        return async (_req, _res, _next) => {
            throw new Error(
                'This method is deprecated, use Account.allowPermissions() instead'
            );
        };
    }

    /**
     * Retrieves all permissions from the database
     * @date 3/8/2024 - 6:07:41 AM
     *
     * @static
     * @async
     * @returns {Promise<RolePermission[]>}
     */
    static async getAllPermissions(): Promise<RolePermission[]> {
        const res = await DB.all('permissions/all');
        if (res.isOk()) {
            return res.value;
        }
        return [];
    }

    /**
     * Retrieves a role from the database given its uuid
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @param {string} id
     * @returns {(Role | undefined)}
     */
    static async fromId(id: string): Promise<Role | undefined> {
        const r = await DB.get('roles/from-id', {
            id
        });
        if (r.isOk() && r.value) return new Role(r.value);
        return;
    }

    /**
     * Retrieves a role from the database given its name
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @param {string} name
     * @returns {(Role | undefined)}
     */
    static async fromName(name: string): Promise<Role | undefined> {
        const r = await DB.get('roles/from-name', {
            name
        });
        if (r.isOk() && r.value) return new Role(r.value);
        return;
    }

    /**
     * Retrieves all roles from the database
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @static
     * @returns {Role[]}
     */
    static async all(): Promise<Role[]> {
        const data = await DB.all('roles/all');
        if (data.isOk()) {
            return data.value
                .map((d: RoleObject) => new Role(d))
                .sort((a: Role, b: Role) => a.rank - b.rank);
        }

        return [];
    }

    /**
     * Creates a new role and adds it to the database
     * @date 3/8/2024 - 6:07:41 AM
     *
     * @static
     * @param {string} name
     * @param {string} description
     * @param {number} rank
     * @returns {Role}
     */
    static new(name: string, description: string, rank: number): Role {
        const id = uuid();
        DB.run('roles/new', {
            name,
            description,
            id,
            rank
        });
        return new Role({
            name,
            description,
            id,
            rank
        });
    }

    /**
     * The name of the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {string}
     */
    name: string;
    /**
     * Description of the role
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {string}
     */
    description: string | undefined;
    /**
     * Rank of the role (higher rank = fewer permissions)
     * @date 1/9/2024 - 12:48:41 PM
     *
     * @type {number}
     */
    rank: number;
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
    async getPermissions(): Promise<RolePermission[]> {
        const data = await DB.all('permissions/from-role', {
            roleId: this.id
        });
        if (data.isOk()) {
            return data.value.filter((p, i, a) => {
                return a.findIndex(pp => pp.permission === p.permission) === i;
            });
        }
        return [];
    }

    /**
     * Adds a permission to the role
     * @date 3/8/2024 - 6:07:40 AM
     *
     * @param {string} permission
     * @returns {Promise<Result<Queries>>}
     */
    addPermission(permission: string) {
        return DB.run('permissions/add-to-role', {
            permission,
            roleId: this.id
        });
    }

    /**
     * Removes a permission from the role
     * @date 3/8/2024 - 6:07:40 AM
     *
     * @param {string} permission
     * @returns {Promise<Result<Queries>>}
     */
    removePermission(permission: string) {
        return DB.run('permissions/remove-from-role', {
            roleId: this.id,
            permission
        });
    }

    /**
     * Deletes the role from the database
     * @date 3/8/2024 - 6:07:40 AM
     *
     * @async
     * @returns {*}
     */
    async delete() {
        // Remove all permissions
        const permissions = await this.getPermissions();
        for (const permission of permissions) {
            this.removePermission(permission.permission);
        }

        DB.run('roles/delete', {
            id: this.id
        });
    }

    /**
     * Saves the role to the database
     * @date 3/8/2024 - 6:07:40 AM
     *
     * @async
     * @returns {unknown}
     */
    async save() {
        return DB.run('roles/update', {
            id: this.id,
            name: this.name,
            description: this.description,
            rank: this.rank
        });
    }
}
