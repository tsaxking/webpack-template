import { ServerRequest } from '../utilities/requests';
import { Role as R } from '../../shared/db-types';
import { attemptAsync, Result } from '../../shared/attempt';
import { Cache } from './cache';
import { Permission } from '../../shared/permissions';
import { EventEmitter } from '../../shared/event-emitter';

/**
 * All events on the static Role object
 * @date 2/8/2024 - 4:23:11 PM
 *
 * @typedef {Events}
 */
type Events = {
    new: Role;
    delete: Role;
    update: Role;
};

/**
 * All events on each role object
 * @date 2/8/2024 - 4:23:11 PM
 *
 * @typedef {RoleEvents}
 */
type RoleEvents = {
    new: Role;
    delete: Role;
    update: Role;
    'add-permission': Permission;
    'remove-permission': Permission;
};

/**
 * Role object, contains permission information and role name
 * @date 2/8/2024 - 4:23:11 PM
 *
 * @export
 * @class Role
 * @typedef {Role}
 * @extends {Cache<RoleEvents>}
 */
export class Role extends Cache<RoleEvents> {
    /**
     * All roles in the system
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @private
     * @static
     * @readonly
     * @type {Role[]}
     */
    private static readonly roles: Role[] = [];

    /**
     * Event emitter for role object updates
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly $emitter = new EventEmitter<keyof Events>();

    /**
     * Add a listener for role object updates
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @template {keyof Events} E
     * @param {E} event
     * @param {(data: Events[E]) => void} listener
     * @returns {void) => void}
     */
    static on<E extends keyof Events>(
        event: E,
        listener: (data: Events[E]) => void,
    ) {
        Role.$emitter.on(event, listener);
    }

    /**
     * Remove a listener for role object updates
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @template {keyof Events} E
     * @param {E} event
     * @param {(data: Events[E]) => void} listener
     * @returns {void) => void}
     */
    static off<E extends keyof Events>(
        event: E,
        listener: (data: Events[E]) => void,
    ) {
        Role.$emitter.off(event, listener);
    }

    /**
     * Emit an event for role object updates
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @template {keyof Events} E
     * @param {E} event
     * @param {Events[E]} data
     */
    static emit<E extends keyof Events>(event: E, data: Events[E]) {
        Role.$emitter.emit(event, data);
    }

    /**
     * Add a listener for role object updates, then remove the listener
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @template {keyof Events} E
     * @param {E} event
     * @param {(data: Events[E]) => void} listener
     * @returns {void) => void}
     */
    static once<E extends keyof Events>(
        event: E,
        listener: (data: Events[E]) => void,
    ) {
        Role.$emitter.once(event, listener);
    }

    /**
     * Gets all roles in the system
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @async
     * @returns {Promise<Result<Role[]>>}
     */
    static async all(): Promise<Result<Role[]>> {
        return attemptAsync(async () => {
            if (Role.roles.length) {
                return Role.roles;
            }

            return (await ServerRequest.post<R[]>('/roles/all', null, {
                cached: true,
            }).then((res) => {
                if (res.isOk()) {
                    return res.value.map((r) => {
                        new Role(r);
                    });
                }
                throw res.error;
            })) as Role[];
        });
    }

    /**
     * Creates a new role in the system
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @async
     * @param {{
     *         name: string;
     *         description: string;
     *     }} data
     * @returns {Promise<Result<Role>>}
     */
    static async new(data: {
        name: string;
        description: string;
    }): Promise<Result<Role>> {
        return attemptAsync(async () => {
            const { name, description } = data;
            const role = await ServerRequest.post<R>('/roles/new', {
                name,
                description,
            });

            if (role.isOk()) {
                return new Role(role.value);
            }

            throw role.error;
        });
    }

    /**
     * Deletes a role from the system
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @async
     * @param {Role} role
     * @returns {Promise<Result<Role>>}
     */
    static async delete(role: Role): Promise<Result<Role>> {
        return attemptAsync(async () => {
            Role.roles.splice(Role.roles.indexOf(role), 1);
            Role.emit('delete', role);
            return role;
        });
    }

    /**
     * Role Id
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly id: string;
    /**
     * Role name
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public name: string;
    /**
     * Role description
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public description?: string;
    /**
     * Role rank
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @public
     * @readonly
     * @type {number}
     */
    public rank: number;

    /**
     * Creates an instance of Role.
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @constructor
     * @param {R} data
     */
    constructor(data: R) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.rank = data.rank;

        if (!Role.roles.find((r) => r.name == this.name)) {
            Role.roles.push(this);
        }
    }

    /**
     * Adds a permission to the role
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @async
     * @param {Permission} permission
     * @returns {Promise<Result<void>>}
     */
    async addPermission(permission: Permission): Promise<Result<void>> {
        return attemptAsync(async () => {
            await ServerRequest.post<void>('/roles/add-permission', {
                roleId: this.id,
                permission,
            });
            this.emit('add-permission', permission);
        });
    }

    /**
     * Removes a permission from the role
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @async
     * @param {Permission} permission
     * @returns {Promise<Result<void>>}
     */
    async removePermission(permission: Permission): Promise<Result<void>> {
        return attemptAsync(async () => {
            await ServerRequest.post<void>('/roles/remove-permission', {
                roleId: this.id,
                permission,
            });
            this.emit('remove-permission', permission);
        });
    }

    /**
     * Retrieves all permission objects for the role
     * @date 2/8/2024 - 4:23:10 PM
     *
     * @returns {Promise<Result<Permission[]>>}
     */
    getPermissions(): Promise<Result<Permission[]>> {
        return ServerRequest.post<Permission[]>(`/roles/permissions`, {
            roleId: this.id,
        });
    }
}
