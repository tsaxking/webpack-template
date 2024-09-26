import { DB } from '../utilities/databases';
import crypto from 'node:crypto';
import { uuid } from '../utilities/uuid';
import { Status } from '../utilities/status';
import { Email, EmailOptions, EmailType } from '../utilities/email';
import Filter from 'bad-words';
import { Member } from './member';
import { AccountSettings } from '../../shared/db-types';
import { Accounts as AccountObject } from '../utilities/tables';
import env from '../utilities/env';
import { removeUpload } from '../utilities/files';
import { Next, ServerFunction } from './app/app';
import { Req } from './app/req';
import { Res } from './app/res';
import { AccountStatusId, RolesStatusId } from '../../shared/status-messages';
import { validate } from '../middleware/data-type';
import { Role as RoleObj } from '../../shared/db-types';
import { Permission } from '../../shared/permissions';
import { attemptAsync, resolveAll, Result } from '../../shared/check';
import { RolePermission } from '../../shared/db-types';
import Role from './roles';
import { AccountNotification } from './cache/account-notifications';

/**
 * Properties that can be changed dynamically
 * @date 1/9/2024 - 12:53:20 PM
 *
 * @export
 * @enum {number}
 */
export enum AccountDynamicProperty {
    firstName = 'firstName',
    lastName = 'lastName',
    picture = 'picture'
}

/**
 * Link to a discord account
 * @date 1/9/2024 - 12:53:20 PM
 *
 * @typedef {DiscordLink}
 */
type DiscordLink = {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
};

/**
 * Account object, this is the main object for the user.
 * @date 1/9/2024 - 12:53:20 PM
 *
 * @export
 * @class Account
 * @typedef {Account}
 */
export default class Account<
    CustomData extends Record<string, unknown> = Record<string, unknown>
> {
    /**
     * Creates a middleware function ensuring that id or username is in the req.body
     * @date 1/9/2024 - 12:53:20 PM
     *
     * @static
     * @param {('id' | 'username')} type
     * @returns {ServerFunction<any>}
     */
    static validate(type: 'id' | 'username'): ServerFunction {
        switch (type) {
            case 'id':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return validate<any>({
                    id: (v: unknown) =>
                        typeof v === 'string' && !!Account.fromId(v)
                });
            case 'username':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return validate<any>({
                    username: (v: unknown) =>
                        typeof v === 'string' && !!Account.fromUsername(v)
                });
        }
    }

    /**
     * Automatically signs in when several conditions are fulfilled:
     *  - The user is not signed in
     *  - The username is provided
     *  - The account exists
     *  - The environment is not production
     * @date 1/9/2024 - 12:53:20 PM
     *
     * @static
     * @param {?string} [username]
     * @returns {ServerFunction<any>}
     */
    static autoSignIn(username?: string): ServerFunction {
        return async (req, _res, next) => {
            if (['test', 'dev'].includes(env.ENVIRONMENT || '')) {
                if (!username) return next();
                if (req.session.accountId) return next();

                const account = (await Account.fromUsername(username)).unwrap();
                if (!account) return next();

                (await req.session.signIn(account)).unwrap();
            }
            next();
        };
    }

    /**
     * Retrieves all unverified accounts
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @returns {*}
     */
    static getUnverifiedAccounts<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >() {
        return attemptAsync(async () => {
            const res = await DB.all('account/unverified');

            if (res.isOk()) {
                return res.value.map(
                    (a: AccountObject) => new Account<AccountCustomData>(a)
                );
            }
            return [];
        });
    }

    /**
     * Retrieves all verified accounts
     * @date 3/8/2024 - 6:12:28 AM
     *
     * @static
     * @async
     * @returns {unknown}
     */
    static getVerifiedAccounts<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >() {
        return attemptAsync(async () => {
            const res = await DB.all('account/verified');

            if (res.isOk()) {
                return res.value.map(
                    (a: AccountObject) => new Account<AccountCustomData>(a)
                );
            }
            return [];
        });
    }

    /**
     * Retrieves an account from the database given its id
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} id
     * @returns {(Account|null)}
     */
    static fromId<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >(id: string) {
        return attemptAsync(async () => {
            const res = await DB.get('account/from-id', {
                id
            });
            if (res.isOk()) {
                if (res.value) return new Account<AccountCustomData>(res.value);
                return undefined;
            }
            return undefined;
        });
    }

    /**
     * Retrieves an account from the database given its username
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} username
     * @returns {(Account|null)}
     */
    static fromUsername<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >(username: string) {
        return attemptAsync(async () => {
            const res = (
                await DB.get('account/from-username', {
                    username: username.toLowerCase()
                })
            ).unwrap();

            if (res) return new Account<AccountCustomData>(res);
        });
    }

    /**
     * Retrieves an account from the database given its email
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} email
     * @returns {(Account|null)}
     */
    static fromEmail<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >(email: string) {
        return attemptAsync(async () => {
            const res = await DB.get('account/from-email', {
                email: email.toLowerCase()
            });
            if (res.isOk()) {
                if (res.value) return new Account<AccountCustomData>(res.value);
            }
        });
    }

    /**
     * Retrieves an account from the database given its verification key
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} key
     * @returns {(Account|null)}
     */
    static async fromVerificationKey<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >(key: string) {
        return attemptAsync(async () => {
            const res = await DB.get('account/from-verification-key', {
                verification: key
            });
            if (res.isOk()) {
                if (res.value) return new Account<AccountCustomData>(res.value);
            }
        });
    }

    /**
     * Retrieves an account from the database given its password change key
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} key
     * @returns {(Account|null)}
     */
    static async fromPasswordChangeKey<
        AccountCustomData extends Record<string, unknown> = Record<
            string,
            unknown
        >
    >(key: string) {
        return attemptAsync(async () => {
            const res = await DB.get('account/from-password-change', {
                passwordChange: key
            });
            if (res.isOk()) {
                if (res.value) return new Account<AccountCustomData>(res.value);
            }
        });
    }

    /**
     * Allows only users with the specified permissions
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {...string[]} permission
     * @returns {ServerFunction<any>}
     */
    static allowPermissions(...permission: Permission[]): ServerFunction {
        return async (req, res, next) => {
            const { session } = req;
            const account = (await session.getAccount()).unwrap();

            if (!account) {
                const s = Status.from('account:not-logged-in', req);
                return s.send(res);
            }

            const permissions = (await account.getPermissions()).unwrap();

            if (
                permission.every((p: string) =>
                    permissions.find(_p => _p.permission === p)
                )
            ) {
                return next();
            }
            const s = Status.from('permissions:unauthorized', req);
            return s.send(res);
        };
    }

    /**
     * Passes the account to the next function if the user is signed in
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {Req<null>} req
     * @param {Res} res
     * @param {Next} next
     * @returns {*}
     */
    static isSignedIn(req: Req<unknown>, res: Res, next: Next) {
        const account = req.session.accountId;

        if (!account) {
            return res.sendStatus('account:not-logged-in');
        }
        next();
    }

    /**
     * Passes the account to the next function if the user is not signed in
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {Req} req
     * @param {Res} res
     * @param {Next} next
     * @returns {*}
     */
    static notSignedIn(req: Req, res: Res, next: Next) {
        const account = req.session.accountId;

        if (account) {
            res.sendStatus('account:logged-in');
        } else {
            next();
        }
    }

    /**
     * Retrieves all accounts from the database
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @returns {Account[]}
     */
    static async getAll() {
        return attemptAsync(async () => {
            return (await DB.all('account/all'))
                .unwrap()
                .map(a => new Account(a));
        });
    }

    // █▄ ▄█ ▄▀▄ █▄ █ ▄▀▄ ▄▀  █ █▄ █ ▄▀     ▄▀▄ ▄▀▀ ▄▀▀ ▄▀▄ █ █ █▄ █ ▀█▀ ▄▀▀
    // █ ▀ █ █▀█ █ ▀█ █▀█ ▀▄█ █ █ ▀█ ▀▄█    █▀█ ▀▄▄ ▀▄▄ ▀▄▀ ▀▄█ █ ▀█  █  ▄█▀

    /**
     * Generates a new hash for a password
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} password
     * @returns {{salt: string, key: string}}
     */
    static newHash(password: string): { salt: string; key: string } {
        const salt = crypto.randomBytes(32).toString('hex');
        const key = Account.hash(password, salt);

        return { salt, key };
    }

    /**
     * Hashes a password with a salt using pbkdf2 and the sha512 algorithm
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} password
     * @param {string} salt
     * @returns {string}
     */
    static hash(password: string, salt: string): string {
        return crypto
            .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
            .toString('hex');
    }

    /**
     * Validates a string to ensure it only contains allowed characters or words
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} str
     * @param {string[]} [chars=[]]
     * @returns {boolean}
     */
    static isValid(
        str: string,
        chars: string[] = []
    ): { valid: boolean; chars: string[] } {
        const allowedCharacters = [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z',
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '_',
            '-',
            '!',
            '@',
            '#',
            '$',
            '%',
            '^',
            '&',
            '*',
            '(',
            ')',
            '+',
            '=',
            '{',
            '}',
            '[',
            ']',
            ':',
            ';',
            '"',
            '\'',
            '<',
            '>',
            '?',
            '/',
            '|',
            ',',
            '.',
            '~',
            '`'
        ];

        allowedCharacters.push(...chars);

        const invalidChars: string[] = [];

        let valid = str
            .toLowerCase()
            .split('')
            .every(char => {
                const validChar = allowedCharacters.includes(char);
                if (!validChar) invalidChars.push(char);
                return validChar;
            });

        if (!valid) console.log('Invalid characters:', invalidChars);

        // test for bad words
        const filtered = new Filter().clean(str);

        if (filtered !== str) {
            valid = false;
            invalidChars.push(
                ...str
                    .split(' ')
                    .filter((word, i) => word !== filtered.split(' ')[i])
            );
        }

        if (!valid) {
            console.log('Invalid characters/words:', invalidChars);
        }

        return {
            valid,
            chars: invalidChars
        };
    }

    /**
     * Creates a new account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @async
     * @param {string} username
     * @param {string} password
     * @param {string} email
     * @param {string} firstName
     * @param {string} lastName
     * @returns {Promise<AccountStatusId>}
     */
    static async create(
        username: string,
        password: string,
        email: string,
        firstName: string,
        lastName: string
    ): Promise<
        Result<{
            status: AccountStatusId;
            data?: string[];
        }>
    > {
        return attemptAsync(async () => {
            if ((await Account.fromUsername(username)).unwrap()) {
                return {
                    status: 'username-taken'
                };
            }
            if ((await Account.fromEmail(email)).unwrap()) {
                return {
                    status: 'email-taken'
                };
            }

            const { isValid } = Account;

            const isValidUsername = isValid(username);
            const isValidPassword = isValid(password);
            const isValidEmail = isValid(email);
            const isValidFirstName = isValid(firstName);
            const isValidLastName = isValid(lastName);

            if (!isValidUsername.valid) {
                return {
                    status: 'invalid-username',
                    data: isValidUsername.chars
                };
            }
            if (!isValidPassword.valid) {
                return {
                    status: 'invalid-password',
                    data: isValidPassword.chars
                };
            }
            if (!isValidEmail.valid) {
                return { status: 'invalid-email', data: isValidEmail.chars };
            }
            if (!isValidFirstName.valid) {
                return {
                    status: 'invalid-first-name',
                    data: isValidFirstName.chars
                };
            }
            if (!isValidLastName.valid) {
                return {
                    status: 'invalid-last-name',
                    data: isValidLastName.chars
                };
            }

            // log('Validating', email);

            // const emailValid = await validate({ email })
            //     .then((results: any) => {
            //         log(results);
            //         return !!results.valid;
            //     })
            //     .catch(() => false);

            // if (!emailValid) return AccountStatus.invalidEmail;

            const { salt, key } = Account.newHash(password);

            const id = uuid();
            const verification = uuid();
            const created = Date.now();

            (
                await DB.run('account/new', {
                    id,
                    username: username.toLowerCase(),
                    key,
                    salt,
                    firstName,
                    lastName,
                    email: email.toLowerCase(),
                    verified: 0,
                    verification,
                    created,
                    phoneNumber: '',
                    customData: '{}'
                })
            ).unwrap();

            const a = new Account({
                id,
                username,
                key,
                salt,
                firstName,
                lastName,
                email,
                verified: 0,
                verification,
                created,
                phoneNumber: '',
                customData: '{}',
                picture: undefined,
                passwordChange: undefined,
                passwordChangeDate: undefined,
                emailChange: undefined
            });

            a.sendVerification();

            return { status: 'created' };
        });
    }

    /**
     * Deletes an account from the database
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} id
     * @returns {AccountStatusId}
     */
    static async delete(id: string): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            const account = (await Account.fromId(id)).unwrap();
            if (!account) return 'not-found';

            DB.run('account/delete', {
                id
            });

            return 'removed';
        });
    }

    /**
     * uuid of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    readonly id: string;
    readonly created: number;
    /**
     * Username of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    username: string;
    /**
     * Hashed password of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    key: string;
    /**
     * Salt used to hash the password
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    salt: string;
    /**
     * First name of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    firstName: string;
    /**
     * Last name of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    lastName: string;
    /**
     * Email of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    email: string;
    /**
     * Date of the last password change
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {?(string|null)}
     */
    passwordChange?: string | undefined;
    /**
     * Discord link of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {?DiscordLink}
     */
    discordLink?: DiscordLink;
    /**
     * Profile picture of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {?string}
     */
    picture?: string;
    /**
     * Whether the account is verified
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {number}
     */
    verified: number;
    /**
     * Key used to verify the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {?string}
     */
    verification?: string;
    /**
     * If the account has requested to change their email, this is the object containing the new email and the date of the request
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {?({
     *         email: string;
     *         date: number;
     *     } | null)}
     */
    emailChange?: {
        email: string;
        date: number;
    } | null;

    /**
     * Custom data of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {CustomData}
     */
    customData: CustomData;
    phoneNumber: string | undefined;
    passwordChangeDate: number | undefined;

    /**
     * Creates an instance of Account.
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @constructor
     * @param {AccountObject} obj
     */
    constructor(obj: AccountObject) {
        this.id = obj.id;
        this.username = obj.username;
        this.key = obj.key;
        this.salt = obj.salt;
        this.firstName = obj.firstName;
        this.lastName = obj.lastName;
        this.email = obj.email;
        this.passwordChange = obj.passwordChange;
        this.passwordChangeDate = obj.passwordChangeDate;
        this.picture = obj.picture;
        this.verified = obj.verified;
        this.verification = obj.verification;
        this.customData = JSON.parse(obj.customData) as CustomData;
        this.created = obj.created;
        this.phoneNumber = obj.phoneNumber;

        if (obj.emailChange) {
            this.emailChange = JSON.parse(obj.emailChange) as {
                email: string;
                date: number;
            };
        }
    }

    /**
     * Verifies the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {AccountStatusId}
     */
    verify(): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            if (this.emailChange) {
                const { email, date } = this.emailChange;
                const now = Date.now();

                // 30 minutes
                if (now - date > 1000 * 60 * 30) {
                    return 'email-change-expired';
                }

                (
                    await DB.run('account/change-email', {
                        id: this.id,
                        email
                    })
                ).unwrap();
                this.email = email;
                delete this.emailChange;

                return 'verified';
            }

            (
                await DB.run('account/verify', {
                    id: this.id
                })
            ).unwrap();
            this.verified = 1;
            delete this.verification;

            return 'verified';
        });
    }

    /**
     * Sends an email to the account with a link to verify their account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {*}
     */
    sendVerification() {
        return attemptAsync(async () => {
            const key = uuid();

            (
                await DB.run('account/set-verification', {
                    verification: key,
                    id: this.id
                })
            ).unwrap();

            const email = new Email(
                this.email,
                'Verify your account',
                EmailType.link,
                {
                    constructor: {
                        link: `${env.DODB}/account/verify/${key}`,
                        linkText: 'Click here to verify your account',
                        title: 'Verify your account',
                        message: 'Click the button below to verify your account'
                    }
                }
            );

            return (await email.send()).unwrap();
        });
    }

    /**
     * Creates an adaptable safe version of the account object (used for sending to the client)
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {?{
     *         roles?: boolean;
     *         memberInfo?: boolean;
     *         permissions?: boolean;
     *         email?: boolean;
     *     }} [include]
     * @returns {{ username: string; firstName: string; lastName: string; picture: string; email: string; roles: {}; memberInfo: any; permissions: {}; }}
     */
    async safe(include?: {
        roles?: boolean;
        memberInfo?: boolean;
        permissions?: boolean;
        email?: boolean;
        id?: boolean;
    }) {
        return attemptAsync(async () => {
            return {
                username: this.username,
                firstName: this.firstName,
                lastName: this.lastName,
                picture: this.picture,
                email: include?.email ? this.email : undefined,
                roles: include?.roles ? (await this.getRoles()).unwrap() : [],
                memberInfo: include?.memberInfo
                    ? (await this.getMemberInfo()).unwrap()
                    : undefined,
                permissions: include?.permissions
                    ? (await this.getPermissions()).unwrap()
                    : [],
                id: include?.id ? this.id : undefined,
                verified: this.verified
            };
        });
    }

    /**
     * member information
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {(Member | null)}
     */
    async getMemberInfo() {
        return Member.get(this.id);
    }

    /**
     * Sends an email to the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} subject
     * @param {EmailType} type
     * @param {EmailOptions} options
     * @returns {*}
     */
    sendEmail(subject: string, type: EmailType, options: EmailOptions) {
        const email = new Email(this.email, subject, type, options);
        return email.send();
    }

    /**
     * All roles of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {Role[]}
     */
    getRoles() {
        return attemptAsync(async () => {
            return (
                await DB.all('account/roles', {
                    id: this.id
                })
            )
                .unwrap()
                .map((r: RoleObj) => new Role(r));
        });
    }

    /**
     * Adds a role to the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} role
     * @returns {(AccountStatusId|RolesStatusId)}
     */
    async addRole(role: Role): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            const roles = (await this.getRoles()).unwrap();
            if (roles.find(_r => _r.name === role.name)) {
                return 'has-role';
            }

            (
                await DB.run('account/add-role', {
                    accountId: this.id,
                    roleId: role.id
                })
            ).unwrap();

            return 'role-added';
        });
    }

    /**
     * Removes a role from the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} role
     * @returns {(AccountStatusId|RolesStatusId)}
     */
    async removeRole(role: Role): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            const roles = (await this.getRoles()).unwrap();

            if (!roles.find(_r => _r.name === role.name)) {
                return 'no-role';
            }

            (
                await DB.run('account/remove-role', {
                    accountId: this.id,
                    roleId: role.id
                })
            ).unwrap();

            return 'role-removed';
        });
    }

    /**
     * Sets the profile picture of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} id
     * @returns {AccountStatusId}
     */
    changePicture(id: string): AccountStatusId {
        if (this.picture) {
            removeUpload(this.picture);
        }

        DB.run('account/update-picture', {
            id: this.id,
            picture: id
        });
        this.picture = id;

        return 'picture-updated';
    }

    /**
     * Gets all roles of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {Permission[]}
     */
    async getPermissions(): Promise<Result<RolePermission[]>> {
        return attemptAsync(async () => {
            const roles = (await this.getRoles()).unwrap();
            return resolveAll(
                await Promise.all(roles.map(role => role.getPermissions()))
            )
                .unwrap()
                .flat();
        });
    }

    /**
     * Checks if the account has a specific permission
     * @date 3/8/2024 - 6:12:28 AM
     *
     * @async
     * @param {Permission} permission
     * @returns {unknown}
     */
    async hasPermission(permission: Permission) {
        return attemptAsync(async () => {
            const permissions = (await this.getPermissions()).unwrap();
            return permissions.some(p => p.permission === permission);
        });
    }

    /**
     * Changes a dynamic property of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {AccountDynamicProperty} property
     * @param {string} to
     * @returns {AccountStatusId}
     */
    change(
        property: AccountDynamicProperty,
        to: string
    ): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            if (
                property !== AccountDynamicProperty.picture &&
                !Account.isValid(to)
            ) {
                switch (property) {
                    case AccountDynamicProperty.firstName:
                        return 'invalid-first-name';
                    case AccountDynamicProperty.lastName:
                        return 'invalid-last-name';
                }
            }

            // using unsafe because the property is validated above using an enum
            const query = `
                UPDATE Accounts
                SET ${property} = ?
                WHERE username = ?        
            `;

            DB.unsafe.run(query, to, this.username);

            this[property] = to;

            return 'updated';
        });
    }

    /**
     * Changes the username of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} username
     * @returns {AccountStatusId}
     */
    changeUsername(username: string): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            const a = await Account.fromUsername(username);
            if (a) return 'username-taken';

            DB.run('account/change-username', {
                id: this.id,
                username
            });

            this.username = username;

            return 'username-changed';
        });
    }

    /**
     * Checks if the password is correct
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} password
     * @returns {boolean}
     */
    async testPassword(password: string): Promise<boolean> {
        const hash = Account.hash(password, this.salt);
        if (hash === this.key) return true; // it works in this database

        // test in the other database because something is wrong with the new hashing algorithm
        const result = await attemptAsync<
            | {
                  success: true;
                  hash: string;
                  salt: string;
              }
            | {
                  success: false;
                  error: string;
              }
        >(async () => {
            const { HASH_SERVER_AUTH, HASH_SERVER } = env;
            if (!HASH_SERVER_AUTH) throw new Error('No hash server auth');
            if (!HASH_SERVER) throw new Error('No hash server');
            const data = await fetch(HASH_SERVER + '/api/login', {
                headers: {
                    'x-auth-key': HASH_SERVER_AUTH
                }
            });

            const json = (await data.json()) as
                | {
                      success: true;
                      hash: string;
                      salt: string;
                  }
                | {
                      success: false;
                      error: string;
                  };

            if (json.success) {
                // update the database with the new account hash
                DB.unsafe.run(
                    `
                    UPDATE Accounts
                    SET key = ?, salt = ?
                    WHERE id = ?
                `,
                    json.hash,
                    json.salt,
                    this.id
                );
            }

            return json;
        });

        if (result.isOk()) {
            return result.value.success;
        }

        return false;
    }

    /**
     * Starts the process of changing the email of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} email
     * @returns {AccountStatusId}
     */
    changeEmail(email: string): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            const exists = await Account.fromEmail(email);

            if (exists) return 'email-taken';

            this.emailChange = {
                email,
                date: Date.now()
            };

            DB.run('account/request-email-change', {
                id: this.id,
                emailChange: JSON.stringify(this.emailChange)
            });

            this.sendVerification();

            return 'check-email';
        });
    }

    /**
     * Starts the process of changing the password of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {string}
     */
    requestPasswordChange(): Promise<Result<string>> {
        return attemptAsync(async () => {
            const key = uuid();
            this.passwordChange = key;

            DB.run('account/request-password-change', {
                id: this.id,
                passwordChange: key
            });

            this.sendEmail('Password change request', EmailType.link, {
                constructor: {
                    link: `${env.DOMAIN}/account/change-password/${key}`,
                    linkText: 'Click here to change your password',
                    title: 'Password change request',
                    message: 'Click the button below to change your password'
                }
            });
            return key;
        });
    }

    /**
     * Changes the password of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} key
     * @param {string} password
     * @returns {AccountStatusId}
     */
    changePassword(
        key: string,
        password: string
    ): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            if (key !== this.passwordChange)
                return 'invalid-password-reset-key';

            const { salt, key: newKey } = Account.newHash(password);
            (
                await DB.run('account/change-password', {
                    id: this.id,
                    salt,
                    key: newKey,
                    passwordChange: undefined
                })
            ).unwrap();
            this.key = newKey;
            this.salt = salt;
            this.passwordChange = undefined;

            return 'password-reset-success';
        });
    }

    /**
     * Returns the role rank
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @readonly
     * @type {number}
     */
    async getRank() {
        return attemptAsync(async () => {
            const roles = (await this.getRoles()).unwrap();
            return Math.min(...roles.map(r => r.rank));
        });
    }

    /**
     * Unverifies the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {AccountStatusId}
     */
    unverify(): Promise<Result<AccountStatusId>> {
        return attemptAsync(async () => {
            (await DB.run('account/unverify', { id: this.id })).unwrap();
            return 'unverified' as AccountStatusId;
        });
    }

    /**
     * Retrieves the settings of the account
     * @date 3/8/2024 - 6:12:28 AM
     *
     * @async
     * @returns {Promise<AccountSettings | undefined>}
     */
    async getSettings() {
        return attemptAsync(async () => {
            const res = (
                await DB.get('account/get-settings', {
                    accountId: this.id
                })
            ).unwrap();
            if (res) return JSON.parse(res.settings) as AccountSettings;
        });
    }

    /**
     * Sets the settings of the account
     * @date 3/8/2024 - 6:12:28 AM
     *
     * @async
     * @param {unknown} settings
     * @returns {unknown}
     */
    async setSettings(settings: unknown) {
        const str = JSON.stringify(settings);
        return DB.run('account/save-settings', {
            accountId: this.id,
            settings: str
        });
    }

    public update(
        data: Partial<Omit<AccountObject, 'id' | 'created'>> & {
            customData?: CustomData;
        }
    ) {
        return DB.run('account/update', {
            id: this.id,
            username: data.username || this.username,
            key: data.key || this.key,
            salt: data.salt || this.salt,
            firstName: data.firstName || this.firstName,
            lastName: data.lastName || this.lastName,
            email: data.email || this.email,
            passwordChange: data.passwordChange || this.passwordChange,
            picture: data.picture || this.picture,
            verified: data.verified || this.verified,
            verification: data.verification || this.verification,
            passwordChangeDate:
                data.passwordChangeDate || this.passwordChangeDate,
            phoneNumber: data.phoneNumber || this.phoneNumber,
            customData: JSON.stringify(data.customData || this.customData)
        });
    }

    public getNotifications() {
        return AccountNotification.fromAccount(this.id);
    }
}
