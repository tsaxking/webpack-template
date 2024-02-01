import { EventEmitter } from '../../shared/event-emitter';
import { Cache } from './cache';
import { AccountSafe, Permission as P, Role as R } from '../../shared/db-types';
import { attemptAsync, Result } from '../../shared/attempt';
import { ServerRequest } from '../utilities/requests';
import { Role } from './roles';

type Events = {
    new: Account;
};

type AccountEvents = {
    update: Account;
};

export class Account extends Cache<AccountEvents> {
    public static current?: Account;

    public static readonly emitter = new EventEmitter<keyof Events>();

    public static on<T extends keyof Events>(
        event: T,
        listener: (data: Events[T]) => void,
    ) {
        this.emitter.on(event, listener);
    }

    public static off<T extends keyof Events>(
        event: T,
        listener: (data: Events[T]) => void,
    ) {
        this.emitter.off(event, listener);
    }

    public static emit<T extends keyof Events>(event: T, data: Events[T]) {
        this.emitter.emit(event, data);
    }

    public static async all(): Promise<Result<Account[]>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.get<AccountSafe[]>('/account/all');

            if (res.isOk()) {
                return res.value.map((account) => new Account(account));
            }

            throw res.error;
        });
    }

    public static readonly $cache = new Map<string, Account>();

    public readonly id: string;
    public username: string;
    public firstName: string;
    public lastName: string;
    public email: string;
    public verified: 0 | 1;
    public created: number;
    public phoneNumber: string;
    public picture?: string;

    constructor(data: AccountSafe) {
        super();
        this.id = data.id;
        this.username = data.username;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.verified = data.verified;
        this.created = data.created;
        this.phoneNumber = data.phoneNumber;
        this.picture = data.picture;

        if (Account.$cache.has(this.id)) {
            Account.$cache.delete(this.id);
        }

        Account.$cache.set(this.id, this);
    }

    public async getRoles(): Promise<Result<Role[]>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<R[]>('/account/get-roles', {
                id: this.id,
            });

            if (res.isOk()) {
                return res.value;
            }

            throw res.error;
        });
    }

    public async getPermissions(): Promise<Result<P[]>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<P[]>(
                '/account/get-permissions',
                {
                    id: this.id,
                },
            );

            if (res.isOk()) {
                return res.value;
            }

            throw res.error;
        });
    }

    public async addRole(role: Role): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/add-role', {
                accountId: this.id,
                name: role.name,
            });

            if (res.isOk()) {
                return;
            }

            throw res.error;
        });
    }

    public async removeRole(role: Role): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/remove-role', {
                accountId: this.id,
                name: role.name,
            });

            if (res.isOk()) {
                return;
            }

            throw res.error;
        });
    }

    public async verify(): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/verify', {
                id: this.id,
            });

            if (res.isOk()) {
                this.verified = 1;
                return;
            }

            throw res.error;
        });
    }

    public async unverify(): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/unverify', {
                id: this.id,
            });

            if (res.isOk()) {
                this.verified = 0;
                return;
            }

            throw res.error;
        });
    }

    public async delete(): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/delete', {
                id: this.id,
            });

            if (res.isOk()) {
                Account.$cache.delete(this.id);
                return;
            }

            throw res.error;
        });
    }
}
