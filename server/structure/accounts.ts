import { DB } from "../utilities/databases.ts";
import crypto from "node:crypto";
import { uuid } from "../utilities/uuid.ts";
import Role from "./roles.ts";
import { Status } from "../utilities/status.ts";
import { Email, EmailOptions, EmailType } from "../utilities/email.ts";
import Filter from 'npm:bad-words';
import { Member } from "./member.ts";
import { Account as AccountObject, MembershipStatus, Member as MemberObj, Skill, Permission } from "../../shared/db-types.ts";
import env from "../utilities/env.ts";
import { deleteUpload } from "../utilities/files.ts";
import { Next, ServerFunction } from './app/app.ts';
import { Req } from "./app/req.ts";
import { Res } from "./app/res.ts";
import { AccountStatusId, RolesStatusId } from "../../shared/status-messages.ts";
import { validate } from "../middleware/data-type.ts";


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
    static validate(type: 'id' | 'username'): ServerFunction<any> {
        switch (type) {
            case 'id':
                return validate({
                    id: (v: any) => typeof v === 'string' && !!Account.fromId(v)
                });
            case 'username':
                return validate({
                    username: (v: any) => typeof v === 'string' && !!Account.fromUsername(v)
                });
        };
    };


    static autoSignIn(username?: string): ServerFunction<any> {
        return (req, res, next) => {
            if (!username) return next();
            const a = req.session?.accountId;
            if (a) return next();

            const account = Account.fromUsername(username);
            if (!account) return next();

            req.session!.accountId = account.id;
            next();
        }
    }

    static unverifiedAccounts() {
        return DB.all('account/unverified').map(a => new Account(a));
    }


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

    static allowPermissions(...permission: string[]): ServerFunction<any> {
        return (req: Req, res: Res, next: Next) => {
            const { session } = req;
            const { account } = session;

            if (!account) {
                const s = Status.from('account:not-logged-in', req);
                return s.send(res);
            }
        }
    }

    static isSignedIn(req: Req<null>, res: Res, next: Next) {
        const { session: { account } } = req;

        if (!account) {
            return res.sendStatus('account:not-logged-in');
        }

        next();
    }

    static notSignedIn(req: Req, res: Res, next: Next) {
        const { session: { account } } = req;

        if (account) {
            return res.sendStatus('account:logged-in');
        }

        next();
    }

    static all(): Account[] {
        const data = DB.all('account/all');
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

    static async create(username: string, password: string, email: string, firstName: string, lastName: string): Promise<AccountStatusId> {
        if (Account.fromUsername(username)) return 'username-taken';
        if (Account.fromEmail(email)) return 'email-taken';

        const { valid } = Account;

        if (!valid(username)) return 'invalid-username';
        if (!valid(password)) return 'invalid-password';
        if (!valid(email)) return 'invalid-email';
        if (!valid(firstName)) return 'invalid-first-name';
        if (!valid(lastName)) return 'invalid-last-name';

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

        return 'created';
    }

    // static async reject(username: string): Promise<AccountStatus> {}

    static delete(id: string): AccountStatusId {
        const account = Account.fromId(id);
        if (!account) return 'not-found';

        DB.run('account/delete', {
            id
        });

        return 'removed';
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
                email
            });
            this.email = email;
            delete this.emailChange;

            return 'verified';
        }


        DB.run('account/verify', {
            id: this.id
        });
        this.verified = 1;
        delete this.verification;

        return 'verified';
    }


    sendVerification() {
        const key = uuid();

        DB.run('account/set-verification', {
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
            roles: include?.roles ? this.getRoles() : [],
            memberInfo: include?.memberInfo ? this.getMemberInfo() : undefined,
            permissions: include?.permissions ? this.getPermissions() : []
        };
    }





    getMemberInfo(): Member | null {
        return Member.get(this.id);
    }

    sendEmail(subject: string, type: EmailType, options: EmailOptions) {
        const email = new Email(this.email, subject, type, options);
        return email.send();
    }







    getRoles(): Role[] {
        const data = DB.all('account/roles', {
            id: this.id
        });

        return data.map((r) => {
            return Role.fromName(r.name);
        }).filter(Boolean) as Role[];
    }

    addRole(role: string): AccountStatusId|RolesStatusId {
        const r = Role.fromName(role);
        if (!r) return 'not-found';

        if ((this.getRoles()).find(_r => _r.name === r.name)) {
            return 'has-role';
        }

        DB.run('account/add-role', {
            accountId: this.id,
            roleId: r.id
        });

        return 'role-added';
    }

    removeRole(role: string): AccountStatusId|RolesStatusId {
        const r = Role.fromName(role);
        if (!r) return 'not-found';

        if (!(this.getRoles()).find(_r => _r.name === r.name)) {
            return 'no-role';
        }

        DB.run('account/remove-role', {
            accountId: this.id,
            roleId: r.id
        });

        return 'role-removed';
    }






    changePicture(id: string): AccountStatusId {
        if (this.picture) {
            deleteUpload(this.picture);
        }

        DB.run('account/update-picture', {
            id: this.id,
            picture: id
        });
        this.picture = id;

        return 'picture-updated';
    }



    getPermissions(): Permission[] {
        const roles = this.getRoles();
        return (roles.flatMap((role) => role.getPermissions()));
    }



    change(property: AccountDynamicProperty, to: string): AccountStatusId {
        if (property !== AccountDynamicProperty.picture &&!Account.valid(to)) {
            switch (property) {
                case AccountDynamicProperty.firstName:
                    return 'invalid-first-name';
                case AccountDynamicProperty.lastName:
                    return 'invalid-last-name';
            }
        }

        const query = `
            UPDATE Accounts
            SET ${property} = ?
            WHERE username = ?        
        `;

        DB.unsafe.run(query, to, this.username);

        this[property] = to;

        return 'updated';
    }


    changeUsername(username: string): AccountStatusId {
        const a = Account.fromUsername(username);
        if (a) return 'username-taken';

        DB.run('account/change-username', {
            id: this.id,
            username
        });

        this.username = username;

        return 'username-changed';
    }


    


    
    testPassword(password: string): boolean {
        const hash = Account.hash(password, this.salt);
        return hash === this.key;
    }


    changeEmail(email: string): AccountStatusId {
        const exists = Account.fromEmail(email);

        if (exists) return 'email-taken';

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

        return 'check-email';
    }

    requestPasswordChange(): string {
        const key = uuid();
        this.passwordChange = key;

        DB.run('account/request-password-change', {
            id: this.id,
            passwordChange: key
        });
        return key;
    }

    changePassword(key: string, password: string): AccountStatusId {
        if (key !== this.passwordChange) return 'invalid-password-reset-key'

        const { salt, key: newKey } = Account.newHash(password);
        DB.run('account/change-password', {
            id: this.id,
            salt,
            key: newKey,
            passwordChange: null
        });
        this.key = newKey;
        this.salt = salt;
        this.passwordChange = null;

        return 'password-reset-success';
    }


    get rank(): number {
        const roles = this.getRoles();
        return Math.min(...roles.map((r) => r.rank));
    }

    unverify(): AccountStatusId {
        DB.run('account/unverify', { id: this.id });
        return 'unverified';
    }


    save() {}
};