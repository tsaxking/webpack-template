import { DB } from "../utilities/databases.ts";
import crypto from "node:crypto";
import { uuid } from "../utilities/uuid.ts";
import Role from "./roles.ts";
import { NextFunction, Request, Response } from "npm:express";
import { Status } from "../utilities/status.ts";
import { validate } from 'npm:deep-email-validator';
import { Email, EmailOptions, EmailType } from "../utilities/email.ts";
import Filter from 'npm:bad-words';
import { Member } from "./member.ts";
import { Account as AccountObject, MembershipStatus, Member as MemberObj, Skill, Permission } from "../../shared/db-types.ts";
import * as fs from 'node:fs';
import * as path from 'node:path';
import env from "../utilities/env.ts";
import { deleteUpload } from "../utilities/files.ts";




export enum AccountStatus {
    success = 'success',
    invalidUsername = 'invalidUsername',
    invalidPassword = 'invalidPassword',
    invalidEmail = 'invalidEmail',
    invalidName = 'invalidName',
    usernameTaken = 'usernameTaken',
    emailTaken = 'emailTaken',
    notFound = 'notFound',
    created = 'created',
    removed = 'removed',
    checkEmail = 'checkEmail',
    emailChangeExpired = 'emailChangeExpired',

    // verification
    alreadyVerified = 'alreadyVerified',
    notVerified = 'notVerified', 
    verified = 'verified',
    invalidVerificationKey = 'invalidVerificationKey',

    // login
    incorrectPassword = 'incorrectPassword',
    incorrectUsername = 'incorrectUsername',
    incorrectEmail = 'incorrectEmail',



    // roles
    hasRole = 'hasRole',
    noRole = 'noRole',
    invalidRole = 'invalidRole',
    roleAdded = 'roleAdded',
    roleRemoved = 'roleRemoved',


    // skills
    hasSkill = 'hasRole',
    noSkill = 'noRole',
    invalidSkill = 'invalidRole',
    skillAdded = 'roleAdded',
    skillRemoved = 'roleRemoved',



    // password change
    passwordChangeSuccess = 'passwordChangeSuccess',  
    passwordChangeInvalid = 'passwordChangeInvalid',
    passwordChangeExpired = 'passwordChangeExpired',
    passwordChangeUsed = 'passwordChangeUsed',



    invalidBio = 'invalidBio',
    invalidTitle = 'invalidTitle',
}

export enum AccountDynamicProperty {
    firstName = 'firstName',
    lastName = 'lastName',
    picture = 'picture'
}


type AccountInfo = {};
type DiscordLink = {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
};


export default class Account {
    static fromId(id: string): Account|null {
        const data = DB.get('account/from-id', {
            id
        });
        if (!data) return null;
        return new Account(data);
    }


    static fromUsername(username: string): Account|null {
        const data = DB.get('account/from-username', {
            username
        });
        if (!data) return null;
        return new Account(data);
    }

    static fromEmail(email: string): Account|null {
        const data = DB.get('account/from-email', {
            email
        });
        if (!data) return null; 
        return new Account(data);
    }

    static fromVerificationKey(key: string): Account|null {
        const data = DB.get('account/from-verification-key', {
            verification: key
        });
        if (!data) return null;
        return new Account(data);
    }

    static fromPasswordChangeKey(key: string): Account|null {
        const data = DB.get('account/from-password-change', {
            passwordChange: key
        });
        if (!data) return null;
        return new Account(data);
    }

    static allowPermissions(...permission: string[]): NextFunction {
        const fn = (req: Request, res: Response, next: NextFunction) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                const s = Status.from('account.notLoggedIn', req);
                return s.send(res);
            }

            // account.getPermissions()
            //     .then((permissions) => {
            //         if (permissions.permissions.every((p) => permission.includes(p))) {
            //             return next();
            //         } else {
            //             const s = Status.from('permissions.invalid', req);
            //             return s.send(res);
            //         }
            //     })
            //     .catch((err) => {
            //         const s = Status.from('permissions.error', req, err);
            //         return s.send(res);
            //     })
        }

        return fn as NextFunction;
    }

    static isSignedIn(req: Request, res: Response, next: NextFunction) {
        const { session: { account } } = req;

        if (!account) {
            return Status.from('account.serverError', req).send(res);
        }

        if (account.username === 'guest') {
            return Status.from('account.notLoggedIn', req).send(res);
        }

        next();
    }

    static notSignedIn(req: Request, res: Response, next: NextFunction) {
        const { session: { account } } = req;

        // if (!account) {
        //     return Status.from('account.serverError', req).send(res);
        // }

        if (account) {
            return Status.from('account.loggedIn', req).send(res);
        }

        next();
    }

    static async all(): Promise<Account[]> {
        const data = await DB.all('account/all');
        return data.map(a => new Account(a));
    }


    // █▄ ▄█ ▄▀▄ █▄ █ ▄▀▄ ▄▀  █ █▄ █ ▄▀     ▄▀▄ ▄▀▀ ▄▀▀ ▄▀▄ █ █ █▄ █ ▀█▀ ▄▀▀ 
    // █ ▀ █ █▀█ █ ▀█ █▀█ ▀▄█ █ █ ▀█ ▀▄█    █▀█ ▀▄▄ ▀▄▄ ▀▄▀ ▀▄█ █ ▀█  █  ▄█▀ 

    static newHash(password: string): {salt: string, key: string} {
        const salt = crypto
            .randomBytes(32)
            .toString('hex');
        const key = Account.hash(password, salt);

        return { salt, key };
    }

    static hash(password: string, salt: string): string {
        return crypto
            .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
            .toString('hex');
    }

    static valid(str: string, chars: string[] = []): boolean {
        const allowedCharacters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
            'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
            'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            '_', '-', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
            '+', '=', '{', '}', '[', ']', ':', ';', '"', "'", '<', '>',
            '?', '/', '|', ',', '.', '~', '`'
        ];

        allowedCharacters.push(...chars);

        const invalidChars:string[] = [];

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
            invalidChars.push(...str.split(' ').filter((word, i) => word !== filtered.split(' ')[i]));
        }



        if (!valid) {
            console.log('Invalid characters/words:', invalidChars);
        }


        return valid;
    }

    static async create(username: string, password: string, email: string, firstName: string, lastName: string): Promise<AccountStatus> {
        if (await Account.fromUsername(username)) return AccountStatus.usernameTaken;
        if (await Account.fromEmail(email)) return AccountStatus.emailTaken;

        const { valid } = Account;

        if (!valid(username)) return AccountStatus.invalidUsername;
        if (!valid(password)) return AccountStatus.invalidPassword;
        if (!valid(email)) return AccountStatus.invalidEmail;
        if (!valid(firstName)) return AccountStatus.invalidName;
        if (!valid(lastName)) return AccountStatus.invalidName;

        const emailValid = await validate({ email })
            .then((results) => !!results.valid)
            .catch(() => false);

        if (!emailValid) return AccountStatus.invalidEmail;

        const { salt, key } = Account.newHash(password);


        await DB.run('account/new', {
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
            phoneNumber: ''
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
            phoneNumber: ''
        });

        a.sendVerification();

        return AccountStatus.created;
    }

    // static async reject(username: string): Promise<AccountStatus> {}

    static async delete(id: string): Promise<AccountStatus> {
        const account = await Account.fromId(id);
        if (!account) return AccountStatus.notFound;

        await DB.run('account/delete', {
            id
        });

        return AccountStatus.removed;
    }

















    id: string;
    username: string;
    key: string;
    salt: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordChange?: string|null;
    discordLink?: DiscordLink;
    picture?: string;
    verified: number;
    verification?: string;
    emailChange?: {
        email: string;
        date: number;
    } | null;

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



    async verify() {
        if (this.emailChange) {
            const { email, date } = this.emailChange;
            const now = Date.now();

            // 30 minutes
            if (now - date > 1000 * 60 * 30) {
                return AccountStatus.emailChangeExpired;
            }

            await DB.run('account/change-email', {
                id: this.id,
                email
            });
            this.email = email;
            delete this.emailChange;

            return AccountStatus.verified;
        }


        await DB.run('account/verify', {
            id: this.id
        });
        this.verified = 1;
        delete this.verification;

        return AccountStatus.verified;
    }


    async sendVerification() {
        const key = uuid();

        await DB.run('account/set-verification', {
            verification: key,
            id: this.id
        });

        const email = new Email(this.email, 'Verify your account', EmailType.link, {
            constructor: {
                link: `${env.DODB}/account/verify/${key}`,
                linkText: 'Click here to verify your account',
                title: 'Verify your account',
                message: 'Click the button below to verify your account'
            }
        });

        return email.send();
    }


    async safe(include?: {
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
            roles: include?.roles ? await this.getRoles() : [],
            memberInfo: include?.memberInfo ? await this.getMemberInfo() : undefined,
            permissions: include?.permissions ? await this.getPermissions() : []
        };
    }





    async getMemberInfo(): Promise<Member | null> {
        return Member.get(this.id);
    }

    async sendEmail(subject: string, type: EmailType, options: EmailOptions) {
        const email = new Email(this.email, subject, type, options);
        return email.send();
    }







    getRoles(): Role[] {
        const data = DB.all('account/roles', {
            accountId: this.id
        });

        return data.map((r) => {
            return Role.fromName(r.name);
        }).filter(Boolean) as Role[];
    }

    addRole(...roles: string[]): AccountStatus[] {
        return roles.map((role) => {
            const r = Role.fromName(role);
            if (!r) return AccountStatus.noRole;

            if ((this.getRoles()).find(_r => _r.name === r.name)) {
                return AccountStatus.hasRole;
            }

            DB.run('account/add-role', {
                accountId: this.id,
                roleId: r.id
            });

            return AccountStatus.roleAdded;
        });
    }

    removeRole(...role: string[]): AccountStatus[] {
        return role.map((role) => {
            const r = Role.fromName(role);
            if (!r) return AccountStatus.noRole;

            if (!(this.getRoles()).find(_r => _r.name === r.name)) {
                return AccountStatus.noRole;
            }

            DB.run('account/remove-role', {
                accountId: this.id,
                roleId: r.id
            });

            return AccountStatus.roleRemoved;
        });
    }






    async changePicture(id: string) {
        if (this.picture) {
            deleteUpload(this.picture);
        }

        await DB.run('account/update-picture', {
            id: this.id,
            picture: id
        });
        this.picture = id;

        return AccountStatus.success;
    }



    async getPermissions(): Promise<Permission[]> {
        const roles = await this.getRoles();
        return (await Promise.all(roles.map((role) => role.getPermissions()))).flat();
    }



    async change(property: AccountDynamicProperty, to: string): Promise<AccountStatus> {
        if (property !== AccountDynamicProperty.picture &&!Account.valid(to)) {
            return AccountStatus.invalidName;
        }

        const query = `
            UPDATE Accounts
            SET ${property} = ?
            WHERE username = ?        
        `;

        await DB.unsafe.run(query, to, this.username);

        this[property] = to;

        return AccountStatus.success;
    }


    async changeUsername(username: string): Promise<AccountStatus> {
        const a = await Account.fromUsername(username);
        if (a) return AccountStatus.usernameTaken;

        await DB.run('account/change-username', {
            id: this.id,
            username
        });

        this.username = username;

        return AccountStatus.success;
    }


    


    
    testPassword(password: string): boolean {
        const hash = Account.hash(password, this.salt);
        return hash === this.key;
    }


    async changeEmail(email: string) {
        const exists = await Account.fromEmail(email);

        if (exists) return AccountStatus.emailTaken;

        this.emailChange = {
            email,
            date: Date.now()
        }

        DB.run(
            'account/request-email-change', 
            {
                id: this.id,
                emailChange: JSON.stringify(this.emailChange)
            }
        );

        this.sendVerification();

        return AccountStatus.checkEmail;
    }

    async requestPasswordChange(): Promise<string> {
        const key = uuid();
        this.passwordChange = key;

        await DB.run('account/request-password-change', {
            id: this.id,
            passwordChange: key
        });
        return key;
    }

    async changePassword(key: string, password: string): Promise<AccountStatus> {
        if (key !== this.passwordChange) return AccountStatus.passwordChangeInvalid;

        const { salt, key: newKey } = Account.newHash(password);
        await DB.run('account/change-password', {
            id: this.id,
            salt,
            key: newKey,
            passwordChange: null
        });
        this.key = newKey;
        this.salt = salt;
        this.passwordChange = null;

        return AccountStatus.passwordChangeSuccess;
    }


    async getRank(): Promise<number> {
        const roles = await this.getRoles();
        return Math.min(...roles.map((r) => r.rank));
    }
};