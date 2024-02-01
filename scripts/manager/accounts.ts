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
    title('Verify an account');
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

export const unverifyAccount = async () => {};
export const removeAccount = async () => {};
export const createAccount = async () => {};

export const accounts = [
    {
        icon: '🔍',
        name: 'Verify Account',
        value: verifyAccount,
    },
    {
        icon: '🗑️',
        name: 'Delete Account',
        value: removeAccount,
    },
    {
        icon: '📝',
        name: 'Create Account',
        value: createAccount,
    },
    {
        icon: '🔄',
        name: 'Unverify Account',
        value: unverifyAccount,
    },
    {
        icon: '➕',
        name: 'Add Role',
        value: addRole,
    },
    {
        icon: '➖',
        name: 'Remove Role',
        value: removeRole,
    },
];
