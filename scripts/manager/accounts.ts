import { backToMain } from '../manager.ts';
import { repeatPrompt, select } from '../prompt.ts';
import Account from '../../server/structure/accounts.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { addRoleToAccount, removeRoleFromAccount } from './roles.ts';

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
export const removeAccount = async () => {
    const account = await selectAccount();
    if (account.isOk()) {
        const isGood = await confirm(
            `Are you sure you want to remove this account? (${account.value.username})`,
        );
        if (isGood) {
            Account.delete(account.value.id);
            backToMain(`Account ${account.value.username} removed`);
        } else backToMain('Account not removed');
    } else {
        backToMain('No accounts to remove');
    }
};
export const createAccount = async () => {
    const username = repeatPrompt(
        'Enter the username',
        undefined,
        Account.isValid,
        false,
    );
    const password = repeatPrompt(
        'Enter the password',
        undefined,
        (data) => !!data.length,
        false,
    );
    repeatPrompt(
        'Confirm the password',
        undefined,
        (data) => data === password,
        false,
    );
    const email = repeatPrompt(
        'Enter the email',
        undefined,
        (data) => !!data.length && /^.+@.+\..+$/.test(data),
        false,
    );
    const firstName = repeatPrompt(
        'Enter the first name',
        undefined,
        Account.isValid,
        false,
    );
    const lastName = repeatPrompt(
        'Enter the last name',
        undefined,
        Account.isValid,
        false,
    );

    const a = Account.create(username, password, email, firstName, lastName);

    if (a === 'created') {
        backToMain(`Account ${username} created`);
    } else {
        backToMain('Unable to create account: ' + a);
    }
};

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
        value: addRoleToAccount,
    },
    {
        icon: '➖',
        value: removeRoleFromAccount,
    },
];
