import { backToMain, title } from '../manager.ts';
import { select } from '../prompt.ts';
import Account from '../../server/structure/accounts.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { addRole, removeRole } from './roles.ts';

export const selectAccount = async (
    message = 'select an account',
): Promise<Result<Account>> => {
    return attemptAsync(async () => {
        const accounts = Account.all;
        if (!accounts.length) {
            throw new Error('no-account');
        }

        return await select<Account>(
            message,
            accounts.map((account) => ({
                name: account.username,
                value: account,
            })),
        );
    });
};

export const verifyAccount = async () => {
    const accounts = Account.unverifiedAccounts;
    if (!accounts.length) return backToMain('No accounts to verify');

    const account = await select<Account>(
        'Select an account to verify',
        accounts.map((a) => ({
            name: a.username,
            value: a,
        })),
        {
            return: true,
        },
    );

    if (account) {
        account.verify();
        backToMain(`Account ${account.username} verified`);
    } else {
        backToMain('Could not find account :(');
    }
};

export const unverifyAccount = async () => {
    const accounts = Account.verifiedAccounts;
    if (!accounts.length) return backToMain('No accounts to unverify');

    const account = await select<Account>(
        'Select an account to unverify',
        accounts.map((a) => ({
            name: a.username,
            value: a,
        })),
        {
            return: true,
        },
    );

    if (account) {
        account.unverify();
        backToMain(`Account ${account.username} unverified`);
    } else {
        backToMain('Could not find account :(');
    }
};
export const removeAccount = async () => {};
export const createAccount = async () => {};

export const accounts = [
    {
        icon: '🔍',
        value: verifyAccount,
    },
    {
        icon: '🗑️',
        value: removeAccount,
    },
    {
        icon: '📝',
        value: createAccount,
    },
    {
        icon: '🔄',
        value: unverifyAccount,
    },
    {
        icon: '➕',
        value: addRole,
    },
    {
        icon: '➖',
        value: removeRole,
    },
];
