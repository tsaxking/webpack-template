import { DB } from '../utilities/databases.ts';
import crypto from 'node:crypto';
import { uuid } from '../utilities/uuid.ts';
import Role from './roles.ts';
import { Status } from '../utilities/status.ts';
import { Email, EmailOptions, EmailType } from '../utilities/email.ts';
import Filter from 'npm:bad-words';
import { Member } from './member.ts';
import {
    Account as AccountObject,
    Member as MemberObj,
    MembershipStatus,
    Permission,
    Skill,
} from '../../shared/db-types.ts';
import env from '../utilities/env.ts';
import { deleteUpload } from '../utilities/files.ts';
import { Next, ServerFunction } from './app/app.ts';
import { Req } from './app/req.ts';
import { Res } from './app/res.ts';
import {
    AccountStatusId,
    RolesStatusId,
} from '../../shared/status-messages.ts';
import { validate } from '../middleware/data-type.ts';

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
    picture = 'picture',
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
export default class Account {
    /**
     * Creates a middleware function ensuring that id or username is in the req.body
     * @date 1/9/2024 - 12:53:20 PM
     *
     * @static
     * @param {('id' | 'username')} type
     * @returns {ServerFunction<any>}
     */
    static validate(type: 'id' | 'username'): ServerFunction<any> {
        switch (type) {
            case 'id':
                return validate({
                    id: (v: any) =>
                        typeof v === 'string' && !!Account.fromId(v),
                });
            case 'username':
                return validate({
                    username: (v: any) =>
                        typeof v === 'string' && !!Account.fromUsername(v),
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
    static autoSignIn(username?: string): ServerFunction<any> {
        return (req, res, next) => {
            if (env.ENVIRONMENT === 'production') return next();

            if (!username) return next();
            const a = req.session?.accountId;
            if (a) return next();

            const account = Account.fromUsername(username);
            if (!account) return next();

            req.session!.accountId = account.id;
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
    static get unverifiedAccounts() {
        return DB.all('account/unverified').map((a) => new Account(a));
    }

    /**
     * Retrieves an account from the database given its id
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} id
     * @returns {(Account|null)}
     */
    static fromId(id: string): Account | null {
        const data = DB.get('account/from-id', {
            id,
        });
        if (!data) return null;
        return new Account(data);
    }

    /**
     * Retrieves an account from the database given its username
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} username
     * @returns {(Account|null)}
     */
    static fromUsername(username: string): Account | null {
        const data = DB.get('account/from-username', {
            username,
        });
        if (!data) return null;
        return new Account(data);
    }

    /**
     * Retrieves an account from the database given its email
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} email
     * @returns {(Account|null)}
     */
    static fromEmail(email: string): Account | null {
        const data = DB.get('account/from-email', {
            email,
        });
        if (!data) return null;
        return new Account(data);
    }

    /**
     * Retrieves an account from the database given its verification key
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} key
     * @returns {(Account|null)}
     */
    static fromVerificationKey(key: string): Account | null {
        const data = DB.get('account/from-verification-key', {
            verification: key,
        });
        if (!data) return null;
        return new Account(data);
    }

    /**
     * Retrieves an account from the database given its password change key
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} key
     * @returns {(Account|null)}
     */
    static fromPasswordChangeKey(key: string): Account | null {
        const data = DB.get('account/from-password-change', {
            passwordChange: key,
        });
        if (!data) return null;
        return new Account(data);
    }

    /**
     * Allows only users with the specified permissions
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {...string[]} permission
     * @returns {ServerFunction<any>}
     */
    static allowPermissions(...permission: string[]): ServerFunction<any> {
        return (req: Req, res: Res, next: Next) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                const s = Status.from('account:not-logged-in', req);
                return s.send(res);
            }

            const { permissions } = account;

            if (permission.every((p) => permissions.find((_p) => _p === p))) {
                return next();
            } else {
                const s = Status.from('permissions:unauthorized', req);
                return s.send(res);
            }
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
    static isSignedIn(req: Req<null>, res: Res, next: Next) {
        const { session: { account } } = req;

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
        const { session: { account } } = req;

        if (account) {
            return res.sendStatus('account:logged-in');
        }

        next();
    }

    /**
     * Retrieves all accounts from the database
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @returns {Account[]}
     */
    static get all(): Account[] {
        const data = DB.all('account/all');
        return data.map((a) => new Account(a));
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
        const salt = crypto
            .randomBytes(32)
            .toString('hex');
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
    static isValid(str: string, chars: string[] = []): boolean {
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
            "'",
            '<',
            '>',
            '?',
            '/',
            '|',
            ',',
            '.',
            '~',
            '`',
        ];

        allowedCharacters.push(...chars);

        const invalidChars: string[] = [];

        let valid = str
            .toLowerCase()
            .split('')
            .every((char) => {
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
                ...str.split(' ').filter((word, i) =>
                    word !== filtered.split(' ')[i]
                ),
            );
        }

        if (!valid) {
            console.log('Invalid characters/words:', invalidChars);
        }

        return valid;
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
        lastName: string,
    ): Promise<AccountStatusId> {
        if (Account.fromUsername(username)) return 'username-taken';
        if (Account.fromEmail(email)) return 'email-taken';

        const { isValid } = Account;

        if (!isValid(username)) return 'invalid-username';
        if (!isValid(password)) return 'invalid-password';
        if (!isValid(email)) return 'invalid-email';
        if (!isValid(firstName)) return 'invalid-first-name';
        if (!isValid(lastName)) return 'invalid-last-name';

        // log('Validating', email);

        // const emailValid = await validate({ email })
        //     .then((results: any) => {
        //         log(results);
        //         return !!results.valid;
        //     })
        //     .catch(() => false);

        // if (!emailValid) return AccountStatus.invalidEmail;

        const { salt, key } = Account.newHash(password);

        DB.run('account/new', {
            id: uuid(),
            username,
            key,
            salt,
            firstName,
            lastName,
            email,
            verified: 0,
            verification: uuid(),
            created: Date.now(),
            phoneNumber: '',
        });

        const a = new Account({
            id: uuid(),
            username,
            key,
            salt,
            firstName,
            lastName,
            email,
            verified: 0,
            verification: uuid(),
            created: Date.now(),
            phoneNumber: '',
        });

        a.sendVerification();

        return 'created';
    }

    /**
     * Deletes an account from the database
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @static
     * @param {string} id
     * @returns {AccountStatusId}
     */
    static delete(id: string): AccountStatusId {
        const account = Account.fromId(id);
        if (!account) return 'not-found';

        DB.run('account/delete', {
            id,
        });

        return 'removed';
    }

    /**
     * uuid of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @type {string}
     */
    readonly id: string;
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
    passwordChange?: string | null;
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
        this.picture = obj.picture;
        this.verified = obj.verified;
        this.verification = obj.verification;

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
    verify(): AccountStatusId {
        if (this.emailChange) {
            const { email, date } = this.emailChange;
            const now = Date.now();

            // 30 minutes
            if (now - date > 1000 * 60 * 30) {
                return 'email-change-expired';
            }

            DB.run('account/change-email', {
                id: this.id,
                email,
            });
            this.email = email;
            delete this.emailChange;

            return 'verified';
        }

        DB.run('account/verify', {
            id: this.id,
        });
        this.verified = 1;
        delete this.verification;

        return 'verified';
    }

    /**
     * Sends an email to the account with a link to verify their account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {*}
     */
    sendVerification() {
        const key = uuid();

        DB.run('account/set-verification', {
            verification: key,
            id: this.id,
        });

        const email = new Email(
            this.email,
            'Verify your account',
            EmailType.link,
            {
                constructor: {
                    link: `${env.DODB}/account/verify/${key}`,
                    linkText: 'Click here to verify your account',
                    title: 'Verify your account',
                    message: 'Click the button below to verify your account',
                },
            },
        );

        return email.send();
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
    safe(include?: {
        roles?: boolean;
        memberInfo?: boolean;
        permissions?: boolean;
        email?: boolean;
    }) {
        return {
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            picture: this.picture,
            email: include?.email ? this.email : undefined,
            roles: include?.roles ? this.roles : [],
            memberInfo: include?.memberInfo ? this.memberInfo : undefined,
            permissions: include?.permissions ? this.permissions : [],
        };
    }

    /**
     * member information
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {(Member | null)}
     */
    get memberInfo(): Member | null {
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
    get roles(): Role[] {
        const data = DB.all('account/roles', {
            id: this.id,
        });

        return data.map((r) => {
            return Role.fromName(r.name);
        }).filter(Boolean) as Role[];
    }

    /**
     * Adds a role to the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} role
     * @returns {(AccountStatusId|RolesStatusId)}
     */
    addRole(role: string): AccountStatusId | RolesStatusId {
        const r = Role.fromName(role);
        if (!r) return 'not-found';

        if (this.roles.find((_r) => _r.name === r.name)) {
            return 'has-role';
        }

        DB.run('account/add-role', {
            accountId: this.id,
            roleId: r.id,
        });

        return 'role-added';
    }

    /**
     * Removes a role from the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} role
     * @returns {(AccountStatusId|RolesStatusId)}
     */
    removeRole(role: string): AccountStatusId | RolesStatusId {
        const r = Role.fromName(role);
        if (!r) return 'not-found';

        if (!this.roles.find((_r) => _r.name === r.name)) {
            return 'no-role';
        }

        DB.run('account/remove-role', {
            accountId: this.id,
            roleId: r.id,
        });

        return 'role-removed';
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
            deleteUpload(this.picture);
        }

        DB.run('account/update-picture', {
            id: this.id,
            picture: id,
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
    get permissions(): Permission[] {
        const { roles } = this;
        return (roles.flatMap((role) => role.getPermissions()));
    }

    /**
     * Changes a dynamic property of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {AccountDynamicProperty} property
     * @param {string} to
     * @returns {AccountStatusId}
     */
    change(property: AccountDynamicProperty, to: string): AccountStatusId {
        if (
            property !== AccountDynamicProperty.picture && !Account.isValid(to)
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
    }

    /**
     * Changes the username of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} username
     * @returns {AccountStatusId}
     */
    changeUsername(username: string): AccountStatusId {
        const a = Account.fromUsername(username);
        if (a) return 'username-taken';

        DB.run('account/change-username', {
            id: this.id,
            username,
        });

        this.username = username;

        return 'username-changed';
    }

    /**
     * Checks if the password is correct
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} password
     * @returns {boolean}
     */
    testPassword(password: string): boolean {
        const hash = Account.hash(password, this.salt);
        return hash === this.key;
    }

    /**
     * Starts the process of changing the email of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} email
     * @returns {AccountStatusId}
     */
    changeEmail(email: string): AccountStatusId {
        const exists = Account.fromEmail(email);

        if (exists) return 'email-taken';

        this.emailChange = {
            email,
            date: Date.now(),
        };

        DB.run(
            'account/request-email-change',
            {
                id: this.id,
                emailChange: JSON.stringify(this.emailChange),
            },
        );

        this.sendVerification();

        return 'check-email';
    }

    /**
     * Starts the process of changing the password of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {string}
     */
    requestPasswordChange(): string {
        const key = uuid();
        this.passwordChange = key;

        DB.run('account/request-password-change', {
            id: this.id,
            passwordChange: key,
        });
        return key;
    }

    /**
     * Changes the password of the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @param {string} key
     * @param {string} password
     * @returns {AccountStatusId}
     */
    changePassword(key: string, password: string): AccountStatusId {
        if (key !== this.passwordChange) return 'invalid-password-reset-key';

        const { salt, key: newKey } = Account.newHash(password);
        DB.run('account/change-password', {
            id: this.id,
            salt,
            key: newKey,
            passwordChange: null,
        });
        this.key = newKey;
        this.salt = salt;
        this.passwordChange = null;

        return 'password-reset-success';
    }

    /**
     * Returns the role rank
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @readonly
     * @type {number}
     */
    get rank(): number {
        const { roles } = this;
        return Math.min(...roles.map((r) => r.rank));
    }

    /**
     * Unverifies the account
     * @date 1/9/2024 - 12:53:19 PM
     *
     * @returns {AccountStatusId}
     */
    unverify(): AccountStatusId {
        DB.run('account/unverify', { id: this.id });
        return 'unverified';
    }

    /**
     * Saves the account to the database (not implemented)
     * @deprecated Not implemented
     * @date 1/9/2024 - 12:53:19 PM
     */
    save() {}
}
