import { Data, Struct, StructData } from './struct';
import { DB } from '../../utilities/database';
import {
    attempt,
    attemptAsync,
    resolveAll,
    Result
} from '../../../shared/check';
import { Req } from '../app/req';
import { Res } from '../app/res';
import { Next, ServerFunction } from '../app/app';
import crypto from 'crypto';
import { log } from '../../utilities/terminal-logging';
import Filter from 'bad-words';
import { trimBody, validate } from '../../middleware/data-type';
import { Status } from '../../utilities/status';
import { Session } from './session';
import { uuid } from '../../utilities/uuid';
import { Permissions } from './permissions';
import env from '../../utilities/env';
import { PropertyAction, DataAction } from '../../../shared/struct';

export namespace Account {
    export const Account = new Struct({
        database: DB,
        structure: {
            username: 'text',
            key: 'text',
            salt: 'text',
            firstName: 'text',
            lastName: 'text',
            email: 'text',
            picture: 'text',
            verified: 'boolean',
            verification: 'text'
            // phoneNumber: 'text'
        },
        name: 'Account',
        validators: {
            email: val => /\S+@\S+\.\S+/.test(String(val)),
            username: val => String(val).length > 0 && String(val) !== 'guest',
            firstName: val => String(val).length > 0,
            lastName: val => String(val).length > 0
        }
    });

    // these will bypass all permissions, bypasses, and everything else that would normally be applied to data, pages, etc.
    // There will be no front end for these structs
    // The only way an account can become an admin is through the manager
    // Only the senior developer should be able to access the manager
    export const Admins = new Struct({
        database: DB,
        structure: {
            accountId: 'text'
        },
        name: 'Admins',
        frontend: false // there will be no front end for this struct
    });

    const isSelf = (a1: AccountData, a2: AccountData) => a1.id === a2.id;

    Account.bypass(DataAction.Delete, isSelf);
    Account.bypass(PropertyAction.Update, isSelf);
    Account.bypass(PropertyAction.Read, isSelf);

    Account.on('delete', async a => {
        const admin = await Admins.fromProperty('accountId', a.id, true);
        admin.pipe(a => a.delete());
    });

    export type AccountData = Data<typeof Account>;

    export const DiscordLink = new Struct({
        database: DB,
        structure: {
            discordID: 'text',
            account: 'text'
        },
        name: 'DiscordLink'
    });

    export const PasswordChange = new Struct({
        database: DB,
        structure: {
            account: 'text',
            key: 'text'
        },
        name: 'PasswordChange',
        lifetime: 1000 * 60 * 30 // 30 minutes
    });

    export const EmailChange = new Struct({
        database: DB,
        structure: {
            account: 'text',
            email: 'text',
            key: 'text',
            expires: 'text'
        },
        name: 'EmailChange',
        validators: {
            expires: (val: unknown) => {
                return new Date(String(val)).toString() !== 'Invalid Date';
            }
        }
    });

    export const Notification = new Struct({
        database: DB,
        structure: {
            accountId: 'text',
            type: 'text',
            data: 'text', // json
            read: 'boolean',
            message: 'text',
            title: 'text'
        },
        name: 'Notification'
    });

    export const CustomData = new Struct({
        database: DB,
        structure: {
            accountId: 'text'
            // flexible based on use-case
        },
        name: 'CustomAccountData'
    });

    export type NotificationData = Data<typeof Notification>;

    const bypassNotif = (a: AccountData, notif: NotificationData) =>
        a.id === notif.data.accountId;

    Notification.bypass(DataAction.Delete, bypassNotif);
    Notification.bypass(PropertyAction.Update, bypassNotif);
    Notification.bypass(PropertyAction.Read, bypassNotif);

    export const Settings = new Struct({
        database: DB,
        structure: {
            accountId: 'text',
            key: 'text',
            value: 'text' // flexible type based on use-case
        },
        name: 'Settings'
    });

    export type SettingsData = Data<typeof Settings>;

    const bypassSettings = (a: AccountData, setting: SettingsData) =>
        a.id === setting.data.accountId;

    Settings.bypass(DataAction.Delete, bypassSettings);
    Settings.bypass(PropertyAction.Update, bypassSettings);
    Settings.bypass(PropertyAction.Read, bypassSettings);

    export const fromUsername = async (username: string) => {
        return attemptAsync<AccountData | undefined>(async () => {
            return (
                await Account.fromProperty('username', username, false)
            ).unwrap()[0];
        });
    };

    export const fromEmail = async (email: string) => {
        return attemptAsync<AccountData | undefined>(async () => {
            return (
                await Account.fromProperty('email', email, false)
            ).unwrap()[0];
        });
    };

    export const fromVerificationKey = async (key: string) => {
        return attemptAsync<AccountData | undefined>(async () => {
            return (
                await Account.fromProperty('verification', key, false)
            ).unwrap()[0];
        });
    };

    export const fromDiscordID = async (discordID: string) => {
        return attemptAsync(async () => {
            // TODO: Optimize through a join query
            const [accounts, discordLinks] = await Promise.all([
                Account.all(false),
                DiscordLink.all(false)
            ]);
            const a = accounts.unwrap();
            const d = discordLinks.unwrap();

            return a.find(a =>
                d.some(
                    dl =>
                        dl.data.discordID === discordID &&
                        dl.data.account === a.id
                )
            );
        });
    };

    export const fromPasswordChangeKey = async (key: string) => {
        return attemptAsync(async () => {
            const pc = (
                await PasswordChange.fromProperty('key', key, false)
            ).unwrap()[0];
            if (!pc) return;

            return (await Account.fromId(pc.data.account)).unwrap();
        });
    };

    export const isSignedIn = async (req: Req, res: Res, next: Next) => {
        if (!(await req.getSession()).unwrap().data.accountId) {
            return res.sendStatus('account:not-logged-in');
        }
        next();
    };

    export const notSignedIn = async (req: Req, res: Res, next: Next) => {
        if (!(await req.getSession()).unwrap().data.accountId) {
            return next();
        }
        return res.sendStatus('account:logged-in');
    };

    export const newHash = (password: string) => {
        return attempt(() => {
            const salt = crypto.randomBytes(32).toString('hex');
            const h = hash(password, salt).unwrap();
            return { salt, hash: h };
        });
    };

    export const hash = (password: string, salt: string) => {
        return attempt(() => {
            return crypto
                .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
                .toString('hex');
        });
    };

    export const validAccountStr = (str: string) => {
        return attempt(() => {
            const chars =
                'abcdefghijklmnopqrstuvwxyz0123456789_-!@#$%^&*()+={}[]|;:,.<>?~`\'"/';
            const invalidChars: string[] = [];

            let valid = str
                .toLowerCase()
                .split('')
                .every(c => {
                    const validChar = chars.includes(c);
                    if (!validChar) invalidChars.push(c);
                    return validChar;
                });

            const filtered = new Filter().clean(str);
            if (filtered !== str) {
                valid = false;
                invalidChars.push(
                    ...str
                        .split(' ')
                        .filter(w => !filtered.split(' ').includes(w))
                );
            }

            if (!valid) log('Invalid characters/words:', invalidChars);

            return {
                valid,
                chars: invalidChars
            };
        });
    };

    export const verify = (account: Data<typeof Account>) => {
        return account.update({
            verified: true,
            verification: ''
        });
    };

    export const unverify = (account: Data<typeof Account>) => {
        return account.update({
            verified: false,
            verification: crypto.randomBytes(32).toString('hex')
        });
    };

    export const selfUpdateAllowed = (
        account: Data<typeof Account>,
        update: Partial<{
            username: string;
            firstName: string;
            lastName: string;
            email: string;
            picture: string;
            phoneNumber: string;
        }>
    ) => {
        return account.update(update);
    };

    export const safe = (account: Data<typeof Account>) => {
        const { data } = account;
        return {
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            picture: data.picture,
            verified: data.verified,
            id: data.id
        };
    };

    export const sendEmail = async (account: Data<typeof Account>) => {
        return attemptAsync(async () => {});
    };

    export const sendVerification = async (account: Data<typeof Account>) => {
        return attemptAsync(async () => {
            if (account.data.verified) return;

            return (await sendEmail(account)).unwrap();
        });
    };

    export const create = async (obj: {
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        email: string;
        picture: string;
        // phoneNumber: string;
    }): Promise<
        Result<
            | Data<typeof Account>
            | {
                  valid: false;
                  reason: string;
              }
        >
    > => {
        return attemptAsync(async () => {
            const { username, password, firstName, lastName, email, picture } =
                obj;

            const [u, e] = await Promise.all([
                fromUsername(username),
                fromEmail(email)
            ]);

            const exists = u.unwrap() || e.unwrap();

            if (exists) {
                return {
                    valid: false,
                    reason: 'Account already exists'
                };
            }

            const validArr = resolveAll(
                [username, password, email, firstName, lastName].map(
                    validAccountStr
                )
            ).unwrap();

            if (!validArr.every(v => v.valid)) {
                return {
                    valid: false,
                    reason:
                        'Invalid chars:' +
                        validArr
                            .filter(v => !v.valid)
                            .flatMap(v => v.chars)
                            .flat()
                            .join(', ')
                };
            }

            const { salt, hash } = newHash(password).unwrap();

            const verification = uuid();

            const account = (
                await Account.new({
                    username,
                    key: hash,
                    salt,
                    email,
                    firstName,
                    lastName,
                    picture,
                    verified: false,
                    verification
                })
            ).unwrap();

            return account;
        });
    };

    const notSignedInStatus = (req: Req) =>
        new Status(
            {
                message: 'Not signed in',
                color: 'danger',
                code: 401,
                instructions: 'Please sign in first.'
            },
            'Account',
            'Not Signed In',
            '{}',
            req
        );

    {
        Account.listen<{
            username: string;
            password: string;
        }>(
            '/sign-in',
            notSignedIn,
            validate({
                username: 'string',
                password: 'string'
            }),
            trimBody,
            async (req, res) => {
                const { username, password } = req.body;

                const incorrectStatus = new Status(
                    {
                        message: 'Incorrect username or password',
                        color: 'danger',
                        code: 401,
                        instructions: 'Please try again.'
                    },
                    'Account',
                    'Incorrect Username or Password',
                    JSON.stringify({ username, password }),
                    req
                );

                const notVerifiedStatus = new Status(
                    {
                        message: 'Account not verified',
                        color: 'danger',
                        code: 401,
                        instructions: 'Please verify your account.'
                    },
                    'Account',
                    'Account Not Verified',
                    JSON.stringify({ username, password }),
                    req
                );

                const signedInStatus = new Status(
                    {
                        message: 'Already signed in',
                        color: 'danger',
                        code: 401,
                        instructions: 'Please sign out first.'
                    },
                    'Account',
                    'Already Signed In',
                    JSON.stringify({ username, password }),
                    req
                );

                const [u, e] = await Promise.all([
                    fromUsername(username),
                    fromEmail(username)
                ]);

                const account = u.unwrap() || e.unwrap();
                if (!account) return res.sendStatus(incorrectStatus);

                const h = hash(password, account.data.salt).unwrap();
                if (h !== account.data.key)
                    return res.sendStatus(incorrectStatus);

                if (!account.data.verified)
                    return res.sendStatus(notVerifiedStatus);

                (
                    await Session.signIn(
                        (await req.getSession()).unwrap(),
                        account
                    )
                ).unwrap();

                res.sendStatus(signedInStatus);

                req.socket?.join([
                    account.id,
                    ...account.getUniverses().unwrap(),
                    ...(await Permissions.getRoles(account))
                        .unwrap()
                        .map(r => r.id)
                ]);
            }
        );

        Account.listen<{
            username: string;
            password: string;
            confirmPassword: string;
            email: string;
            firstName: string;
            lastName: string;
            // phoneNumber: string;
        }>(
            '/sign-up',
            notSignedIn,
            validate({
                username: 'string',
                password: 'string',
                confirmPassword: 'string',
                email: 'string',
                firstName: 'string',
                lastName: 'string'
                // phoneNumber: 'string',
            }),
            trimBody,
            async (req, res) => {
                const {
                    username,
                    password,
                    confirmPassword,
                    email,
                    firstName,
                    lastName
                } = req.body;
                const session = await req.getSession();

                if (password !== confirmPassword) {
                    return res.sendStatus(
                        new Status(
                            {
                                message: 'Passwords do not match',
                                color: 'danger',
                                code: 400,
                                instructions: 'Please try again.'
                            },
                            'Account',
                            'Passwords Do Not Match',
                            JSON.stringify({
                                username,
                                password,
                                email,
                                firstName,
                                lastName
                            }),
                            req
                        )
                    );
                }

                const accountOrReason = (
                    await create({
                        username,
                        password,
                        firstName,
                        lastName,
                        email,
                        picture: ''
                    })
                ).unwrap();

                if (accountOrReason instanceof StructData) {
                    return res.sendStatus(
                        new Status(
                            {
                                message: 'Account created',
                                color: 'success',
                                code: 201,
                                instructions: 'Please verify your account.',
                                redirect:
                                    (await req.getSession()).unwrap().data
                                        .prevUrl || '/'
                            },
                            'Account',
                            'Account Created',
                            JSON.stringify({
                                username,
                                password,
                                email,
                                firstName,
                                lastName
                            }),
                            req
                        )
                    );
                }

                return res.sendStatus(
                    new Status(
                        {
                            message: accountOrReason.reason,
                            color: 'danger',
                            code: 400,
                            instructions: 'Please try again.'
                        },
                        'Account',
                        'Account Creation Failed',
                        JSON.stringify({
                            username,
                            password,
                            email,
                            firstName,
                            lastName
                        }),
                        req
                    )
                );

                // const [u, e] = await Promise.all([
                //     fromUsername(username),
                //     fromEmail(email),
                // ]);

                // const exists = u.unwrap() || e.unwrap();
                // if (exists) {
                //     return res.sendStatus(new Status(
                //         {
                //             message: 'Account already exists',
                //             color: 'danger',
                //             code: 400,
                //             instructions: 'Please try again.'
                //         },
                //         'Account',
                //         'Account Already Exists',
                //         JSON.stringify({ username, password, email, firstName, lastName }),
                //         req,
                //     ));
                // }

                // const validArr = resolveAll([
                //     username,
                //     password,
                //     email,
                //     firstName,
                //     lastName,
                // ].map(validAccountStr)).unwrap();

                // if (!validArr.every(v => v.valid)) {
                //     return res.sendStatus(new Status(
                //         {
                //             message: 'Invalid characters/words (valid characters: a-z, 0-9, _-!@#$%^&*()+={}[]|;:,.<>?~`\'"/)',
                //             color: 'danger',
                //             code: 400,
                //             instructions: 'Please try again.'
                //         },
                //         'Account',
                //         'Invalid Characters/Words',
                //         JSON.stringify(validArr),
                //         req,
                //     ));
                // }

                // const { salt, hash } = newHash(password).unwrap();

                // const verification = uuid();

                // const account = (await Account.new({
                //     username,
                //     key: hash,
                //     salt,
                //     email,
                //     firstName,
                //     lastName,
                //     picture: '',
                //     verified: false,
                //     verification,
                // })).unwrap();

                // sendVerification(account);
            }
        );

        Account.listen('/get-self', async (req, res) => {
            const account = await (
                await Session.getAccount(req.sessionId)
            ).unwrap();
            if (!account) return res.sendStatus(notSignedInStatus(req));

            res.json(safe(account));
        });

        Account.listen('/sign-out', isSignedIn, async (req, res) => {
            await Session.signOut((await req.getSession()).unwrap());
            res.sendStatus(
                new Status(
                    {
                        message: 'Signed out',
                        color: 'success',
                        code: 200,
                        instructions: 'Please sign in again.'
                    },
                    'Account',
                    'Signed Out',
                    JSON.stringify((await req.getSession()).unwrap().data),
                    req
                )
            );

            // TODO: Test if this will prevent the user from reconnecting in the future
            req.socket?.disconnect();
        });

        Account.listen<{
            password: string;
            confirmPassword: string;
            key: string;
        }>(
            '/change-password',
            validate({
                password: 'string',
                confirmPassword: 'string',
                key: 'string'
            }),
            async (req, res) => {
                const { password, confirmPassword, key } = req.body;

                const a = (await fromPasswordChangeKey(key)).unwrap();

                if (!a)
                    return res.sendStatus(
                        new Status(
                            {
                                message: 'Invalid password reset key',
                                color: 'danger',
                                code: 400,
                                instructions: 'Please try again.'
                            },
                            'Account',
                            'Invalid Password Reset Key',
                            JSON.stringify({ password, confirmPassword, key }),
                            req
                        )
                    );

                if (password !== confirmPassword)
                    return res.sendStatus(
                        new Status(
                            {
                                message: 'Passwords do not match',
                                color: 'danger',
                                code: 400,
                                instructions: 'Please try again.'
                            },
                            'Account',
                            'Passwords Do Not Match',
                            JSON.stringify({ password, confirmPassword, key }),
                            req
                        )
                    );

                const { hash, salt } = newHash(password).unwrap();

                a.update({
                    key: hash,
                    salt
                });

                res.sendStatus(
                    new Status(
                        {
                            message: 'Password reset',
                            color: 'success',
                            code: 200,
                            instructions: 'Please sign in again.'
                        },
                        'Account',
                        'Password Reset',
                        JSON.stringify({ password, confirmPassword, key }),
                        req
                    )
                );
            }
        );

        Account.listen<{
            username: string;
        }>(
            '/request-password-reset',
            validate({
                username: 'string'
            }),
            async (req, res) => {
                const { username } = req.body;

                const account = (await fromUsername(username)).unwrap();

                if (!account)
                    return res.sendStatus(
                        new Status(
                            {
                                message: 'Account not found',
                                color: 'danger',
                                code: 404,
                                instructions: 'Please try again.'
                            },
                            'Account',
                            'Account Not Found',
                            JSON.stringify({ username }),
                            req
                        )
                    );

                const passwordChange = (
                    await PasswordChange.new({
                        account: account.id,
                        key: uuid()
                    })
                ).unwrap();

                // send email
                // TODO: password reset email

                res.sendStatus(
                    new Status(
                        {
                            message: 'Password reset request',
                            color: 'success',
                            code: 200,
                            instructions: 'Please check your email.'
                        },
                        'Account',
                        'Password Reset Request',
                        JSON.stringify({ username }),
                        req
                    )
                );
            }
        );
    }

    export const autoSignIn =
        (username: string): ServerFunction =>
        async (req, res, next) => {
            if ((await req.getSession()).unwrap().data.accountId) return next();

            if (env.ENVIRONMENT === 'prod') return next();

            const account = (await fromUsername(username)).unwrap();
            if (!account) {
                log(`Account not found, cannot auto sign in. (${username})`);
                return next();
            }

            (
                await Session.signIn((await req.getSession()).unwrap(), account)
            ).unwrap();

            next();
        };

    export const isAdmin = async (account: AccountData) => {
        return attemptAsync(async () => {
            return !!(
                await Admins.fromProperty('accountId', account.id, false)
            ).unwrap()[0];
        });
    };
}

// TODO: Password reset api
