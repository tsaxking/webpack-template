import { ServerRequest } from '../utilities/requests';
import { Role as R, RolePermission } from '../../shared/db-types';
import { attemptAsync, Result } from '../../shared/attempt';
import { Cache } from './cache';
import { EventEmitter } from '../../shared/event-emitter';
import { socket } from '../utilities/socket';

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
    'change-permissions': RolePermission[];
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
     * Event emitter for role object updates
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly $emitter = new EventEmitter<keyof Events>();

    static readonly cache = new Map<string, Role>();

    static permissions: RolePermission[] = [];

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
    static async all(force = false): Promise<Result<Role[]>> {
        return attemptAsync(async () => {
            if (Role.cache.size && !force) {
                return Array.from(Role.cache.values());
            }

            return (await ServerRequest.post<
                (R & { permissions: RolePermission[] })[]
            >('/roles/all', null, {
                cached: true,
            }).then((res) => {
                if (res.isOk()) {
                    console.log(res.value);
                    return res.value.map((r) => new Role(r));
                }
                throw res.error;
            })) as Role[];
        });
    }

    static async getAllPermissions(): Promise<Result<RolePermission[]>> {
        return attemptAsync(async () => {
            if (Role.permissions.length) return Role.permissions;

            const res = await ServerRequest.post<RolePermission[]>(
                '/roles/all-permissions',
                null,
                {
                    cached: true,
                },
            );

            if (res.isOk()) {
                Role.permissions = res.value;
                return res.value;
            }

            throw res.error;
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
            const role = await ServerRequest.post<
                R & { permissions: RolePermission[] }
            >('/roles/new', {
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
     * Role permissions
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @public
     * @readonly
     * @type {Permission[]}
     */
    public permissions: RolePermission[];

    /**
     * Creates an instance of Role.
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @constructor
     * @param {R} data
     */
    constructor(
        data: R & {
            permissions: RolePermission[];
        },
    ) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.rank = data.rank;
        this.permissions = data.permissions;

        Role.cache.set(this.id, this);
    }

    /**
     * Adds a permission to the role
     * @date 2/8/2024 - 4:23:11 PM
     *
     * @async
     * @param {Permission} permission
     * @returns {Promise<Result<void>>}
     */
    async addPermission(permission: RolePermission): Promise<Result<void>> {
        return await ServerRequest.post<void>('/roles/add-permission', {
            id: this.id,
            permission: permission.permission,
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
    async removePermission(permission: RolePermission): Promise<Result<void>> {
        return await ServerRequest.post<void>('/roles/remove-permission', {
            id: this.id,
            permission: permission.permission,
        });
    }

    async delete(): Promise<Result<void>> {
        return await ServerRequest.post<void>('/roles/delete', {
            id: this.id,
        });
    }
}

socket.on(
    'roles:added-permission',
    (data: { roleId: string; permissions: RolePermission[] }) => {
        const { roleId, permissions } = data;
        const r = Role.cache.get(roleId);
        if (!r) return console.error('Role not found');

        r.permissions = permissions;

        r.emit('change-permissions', permissions);

        Role.emit('update', r);
    },
);

socket.on(
    'roles:removed-permission',
    (data: { roleId: string; permissions: RolePermission[] }) => {
        const { roleId, permissions } = data;
        const r = Role.cache.get(roleId);
        if (!r) return console.error('Role not found');

        r.permissions = permissions;

        r.emit('change-permissions', permissions);
        Role.emit('update', r);
    },
);
