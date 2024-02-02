import { ServerRequest } from '../utilities/requests';
import { Role as R } from '../../shared/db-types';
import { attemptAsync, Result } from '../../shared/attempt';
import { Cache } from './cache';
import { Permission } from '../../shared/permissions';
import { EventEmitter } from '../../shared/event-emitter';

type Events = {
    new: Role;
    delete: Role;
    update: Role;
};

type RoleEvents = {
    new: Role;
    delete: Role;
    update: Role;
    'add-permission': Permission;
    'remove-permission': Permission;
};

export class Role extends Cache<RoleEvents> {
    private static readonly roles: Role[] = [];

    static readonly $emitter = new EventEmitter<keyof Events>();

    static on<E extends keyof Events>(
        event: E,
        listener: (data: Events[E]) => void,
    ) {
        Role.$emitter.on(event, listener);
    }

    static off<E extends keyof Events>(
        event: E,
        listener: (data: Events[E]) => void,
    ) {
        Role.$emitter.off(event, listener);
    }

    static emit<E extends keyof Events>(event: E, data: Events[E]) {
        Role.$emitter.emit(event, data);
    }

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

    static async delete(role: Role): Promise<Result<Role>> {
        return attemptAsync(async () => {
            Role.roles.splice(Role.roles.indexOf(role), 1);
            Role.emit('delete', role);
            return role;
        });
    }

    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly rank: number;

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

    async addPermission(permission: Permission): Promise<Result<void>> {
        return attemptAsync(async () => {
            await ServerRequest.post<void>('/roles/add-permission', {
                roleId: this.id,
                permission,
            });
            this.emit('add-permission', permission);
        });
    }

    async removePermission(permission: Permission): Promise<Result<void>> {
        return attemptAsync(async () => {
            await ServerRequest.post<void>('/roles/remove-permission', {
                roleId: this.id,
                permission,
            });
            this.emit('remove-permission', permission);
        });
    }

    getPermissions(): Promise<Result<Permission[]>> {
        return ServerRequest.post<Permission[]>(`/roles/permissions`, {
            roleId: this.id,
        });
    }
}
