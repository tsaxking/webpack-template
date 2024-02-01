import { title, backToMain } from '../manager.ts';
import { select } from '../prompt.ts';
import Account from '../../server/structure/accounts.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { removeRole, addRole } from './roles.ts';

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


export const accounts = async () => {
    title('Accounts');
    type AccountCommands = 'add-role' | 'remove-role' | 'verify' | 'unverify' | 'delete' | 'create';

    const data = await select<AccountCommands>(
        'Please select an account task',
        [
            {
                name: 'Add Role',
                value: 'add-role'
            },
            {
                name: 'Remove Role',
                value: 'remove-role'
            },
            {
                name: 'Verify',
                value: 'verify',
            },
            {
                name: 'Unverify',
                value: 'unverify'
            },
            {
                name: 'Delete',
                value: 'delete'
            },
            {
                name: 'Create',
                value: 'create'
            }
        ]
    );

    switch (data) {
        case 'add-role':
            return addRole();
        case 'remove-role':
            return removeRole();
        case 'verify':
            return verifyAccount();
        case 'unverify':
            return unverifyAccount();
        case 'delete':
            return removeAccount();
        case 'create':
            return createAccount();
    }
};