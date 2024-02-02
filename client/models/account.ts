import { EventEmitter } from '../../shared/event-emitter';
import { Cache } from './cache';
import { AccountSafe, Role as R } from '../../shared/db-types';
import { Permission as P } from '../../shared/permissions';
import { attemptAsync, Result } from '../../shared/attempt';
import { ServerRequest } from '../utilities/requests';
import { Role } from './roles';

/**
 * All account events
 * @date 2/1/2024 - 12:54:21 AM
 *
 * @typedef {Events}
 */
type Events = {
    new: Account;
};

/**
 * All account specific events
 * @date 2/1/2024 - 12:54:21 AM
 *
 * @typedef {AccountEvents}
 */
type AccountEvents = {
    update: Account;
};

/**
 * Account class used to manage account data
 * @date 2/1/2024 - 12:54:21 AM
 *
 * @export
 * @class Account
 * @typedef {Account}
 * @extends {Cache<AccountEvents>}
 */
export class Account extends Cache<AccountEvents> {
    /**
     * Current account, if any
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @type {?Account}
     */
    public static current?: Account;

    /**
     * Account emitter
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @readonly
     * @type {*}
     */
    public static readonly emitter = new EventEmitter<keyof Events>();

    /**
     * adds a listener to the account emitter
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @template {keyof Events} T
     * @param {T} event
     * @param {(data: Events[T]) => void} listener
     * @returns {void) => void}
     */
    public static on<T extends keyof Events>(
        event: T,
        listener: (data: Events[T]) => void,
    ) {
        this.emitter.on(event, listener);
    }

    /**
     *  removes a listener from the account emitter
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @template {keyof Events} T
     * @param {T} event
     * @param {(data: Events[T]) => void} listener
     * @returns {void) => void}
     */
    public static off<T extends keyof Events>(
        event: T,
        listener: (data: Events[T]) => void,
    ) {
        this.emitter.off(event, listener);
    }

    /**
     * emits an event from the account emitter
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @template {keyof Events} T
     * @param {T} event
     * @param {Events[T]} data
     */
    public static emit<T extends keyof Events>(event: T, data: Events[T]) {
        this.emitter.emit(event, data);
    }

    /**
     * Gets all accounts
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @async
     * @returns {Promise<Result<Account[]>>}
     */
    public static async all(): Promise<Result<Account[]>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<AccountSafe[]>('/account/all');

            if (res.isOk()) {
                return res.value.map((account) => new Account(account));
            }

            throw res.error;
        });
    }

    /**
     * Cache of all accounts
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @static
     * @readonly
     * @type {*}
     */
    public static readonly $cache = new Map<string, Account>();

    /**
     * Account id
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly id: string;
    /**
     * Account username
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {string}
     */
    public username: string;
    /**
     * Account first name
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {string}
     */
    public firstName: string;
    /**
     * Account last name
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {string}
     */
    public lastName: string;
    /**
     * Account email
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {string}
     */
    public email: string;
    /**
     * Account verification status
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {(0 | 1)}
     */
    public verified: 0 | 1;
    /**
     * Account creation date
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {number}
     */
    public created: number;
    /**
     * Account phone number
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {string}
     */
    public phoneNumber: string;
    /**
     * Account picture
     * @date 2/1/2024 - 12:54:21 AM
     *
     * @public
     * @type {?string}
     */
    public picture?: string;

    /**
     * Creates an instance of Account.
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @constructor
     * @param {AccountSafe} data
     */
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

    /**
     * Retrieves all roles for the account
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<Role[]>>}
     */
    public async getRoles(): Promise<Result<Role[]>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<R[]>('/account/get-roles', {
                id: this.id,
            });

            if (res.isOk()) {
                return res.value.map((r) => new Role(r));
            }

            throw res.error;
        });
    }

    /**
     * Retrieves all permissions for the account
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<P[]>>}
     */
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

    /**
     * Adds a role to the account (if permitted)
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @param {Role} role
     * @returns {Promise<Result<void>>}
     */
    public async addRole(role: Role): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/add-role', {
                accountId: this.id,
                roleId: role.id,
            });

            if (res.isOk()) {
                return;
            }

            throw res.error;
        });
    }

    /**
     * Removes a role from the account (if permitted)
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @param {Role} role
     * @returns {Promise<Result<void>>}
     */
    public async removeRole(role: Role): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/remove-role', {
                accountId: this.id,
                roleId: role.id,
            });

            if (res.isOk()) {
                return;
            }

            throw res.error;
        });
    }

    /**
     * Verifies the account (if permitted)
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<void>>}
     */
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

    /**
     * Unverifies the account (if permitted)
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<void>>}
     */
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

    /**
     * Description placeholder
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<void>>}
     */
    public async reject(): Promise<Result<void>> {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<void>('/account/reject', {
                id: this.id,
            });

            if (res.isOk()) {
                Account.$cache.delete(this.id);
                this.destroy();
                return;
            }

            throw res.error;
        });
    }

    /**
     * Deletes the account (if permitted)
     * @date 2/1/2024 - 12:54:20 AM
     *
     * @public
     * @async
     * @returns {Promise<Result<void>>}
     */
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
