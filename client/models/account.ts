import { read } from 'fs';
import { socket } from '../utilities/socket';
import { Data, StructData, Struct, SingleWritable, Structable } from './struct';
import { Blank } from '../../shared/struct';
import { attemptAsync } from '../../shared/check';
import { Writable } from 'svelte/store';

export namespace Accounts {
    export const Account = new Struct({
        name: 'Account',
        socket,
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
        }
    });

    export type AccountData = StructData<typeof Account.data.structure>;

    export const self = new SingleWritable(
        Account.Generator({
            username: 'guest',
            firstName: 'Guest',
            lastName: 'Guest',
            key: '',
            salt: '',
            email: '',
            picture: '',
            verified: false,
            verification: ''
        })
    );

    export const DiscordLink = new Struct({
        name: 'DiscordLink',
        socket,
        structure: {
            discordID: 'text',
            account: 'text'
        }
    });

    export const PasswordChange = new Struct({
        name: 'PasswordChange',
        socket,
        structure: {
            account: 'text',
            key: 'text'
        }
    });

    export const EmailChange = new Struct({
        name: 'EmailChange',
        socket,
        structure: {
            account: 'text',
            email: 'text',
            key: 'text',

            expires: 'text'
        }
    });

    export const Notification = new Struct({
        name: 'Notification',
        socket,
        structure: {
            accountId: 'text',
            type: 'text',
            data: 'text',
            read: 'boolean',
            message: 'text',
            title: 'text'
        }
    });

    export type NotificationData = StructData<
        typeof Notification.data.structure
    >;

    export const Settings = new Struct({
        name: 'Settings',
        socket,
        structure: {
            accountId: 'text',
            key: 'text',
            value: 'text'
        }
    });

    export type SettingsData = StructData<typeof Settings.data.structure>;

    export const signIn = (username: string, password: string) => {
        return Account.post('/sign-in', { username, password });
    };

    export const signUp = (data: {
        username: string;
        password: string;
        confirmPassword: string;
        email: string;
        firstName: string;
        lastName: string;
        // phoneNumber: string;
    }) => {
        return Account.post('/sign-up', data);
    };

    export const signOut = () => {
        return attemptAsync(async () => {
            (await Account.post('/sign-out', {})).unwrap();
            self.set(
                Account.Generator({
                    username: 'guest',
                    firstName: 'Guest',
                    lastName: 'Guest',
                    key: '',
                    salt: '',
                    email: '',
                    picture: '',
                    verified: false,
                    verification: ''
                })
            );
        });
    };

    export const getSelf = () => {
        return attemptAsync(async () => {
            if (self.get().data.username !== 'guest') return self;

            const a = (
                await Account.post<Structable<typeof Account.data.structure>>(
                    '/self',
                    {}
                )
            ).unwrap();
            self.set(Account.Generator(a));

            return self;
        });
    };

    export const requestPasswordReset = (username: string) => {
        return Account.post('/request-password-reset', {
            username
        });
    };

    export const changePassword = (
        password: string,
        confirmPassword: string,
        key: string
    ) => {
        return Account.post('/change-password', {
            password,
            confirmPassword,
            key
        });
    };
}
