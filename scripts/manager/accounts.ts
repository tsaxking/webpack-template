import { backToMain } from '../manager.ts';
import { repeatPrompt, search } from '../prompt.ts';
import Account from '../../server/structure/accounts.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { addRoleToAccount, removeRoleFromAccount } from './roles.ts';

export const selectAccount = async (
    message = 'select an account',
    filter: (a: Account) => boolean = () => true,
): Promise<Result<Account | undefined>> => {
    return attemptAsync(async () => {
        const accounts = (await Account.getAll()).filter(filter);
        if (!accounts.length) {
            throw new Error('no-account');
        }

        const res = await search(
            message,
            accounts.map((a) => a.username),
        );

        if (res.isErr()) return;

        return accounts.find((a) => a.username === res.value);
    });
};

export const verifyAccount = async () => {
    const account = await selectAccount(
        'Select an account to verify',
        (a) => !a.verified,
    );

    if (account.isErr()) return backToMain('No accounts to verify');
    if (account.value) {
        account.value.verify();
        backToMain(`Account ${account.value.username} verified`);
    } else {
        backToMain('Could not find account :(');
    }
};

export const unverifyAccount = async () => {
    const res = await selectAccount(
        'Select an account to unverify',
        (a) => !!a.verified,
    );

    if (res.isErr()) return backToMain('No accounts to unverify');
    const account = res.value;

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
        if (!account.value) return backToMain('Could not find account :(');
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
        (str: string) => Account.isValid(str).valid,
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
        (str: string) => Account.isValid(str).valid,
        false,
    );
    const lastName = repeatPrompt(
        'Enter the last name',
        undefined,
        (str: string) => Account.isValid(str).valid,
        false,
    );

    const a = await Account.create(
        username,
        password,
        email,
        firstName,
        lastName,
    );

    if (a.status === 'created') {
        backToMain(`Account ${username} created`);
    } else {
        backToMain('Unable to create account: ' + a);
    }
};

export const accounts = [
    {
        icon: '🔍',
        value: verifyAccount,
        description: 'Verify an account',
    },
    {
        icon: '🗑️',
        value: removeAccount,
        description: 'Remove an account',
    },
    {
        icon: '📝',
        value: createAccount,
        description: 'Create an account',
    },
    {
        icon: '🔄',
        value: unverifyAccount,
        description: 'Unverify an account',
    },
    {
        icon: '➕',
        value: addRoleToAccount,
        description: 'Add a role to an account',
    },
    {
        icon: '➖',
        value: removeRoleFromAccount,
        description: 'Remove a role from an account',
    },
];
