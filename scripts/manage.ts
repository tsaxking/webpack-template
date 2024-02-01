import Role from '../server/structure/roles.ts';
import Account from '../server/structure/accounts.ts';
import { confirm, repeatPrompt, select } from './prompt.ts';
import { Colors } from '../server/utilities/colors.ts';
import { sleep } from '../shared/sleep.ts';
import { attemptAsync, Result } from '../shared/check.ts';
import { Permission } from '../shared/permissions.ts';
import { DB } from '../server/utilities/databases.ts';
import { RolePermission } from '../shared/db-types.ts';

const backToMain = async (message: string) => {
    console.log(message);
    await sleep(2000);
    main();
};

const title = (t: string) => {
    console.clear();
    console.log(Colors.FgGreen, t, Colors.Reset);
};

const selectRole = async (message = 'Select a role'): Promise<Result<Role>> => {
    return attemptAsync(async () => {
        const roles = Role.all();
        if (!roles.length) {
            throw new Error('no-role');
        }

        return await select<Role>(
            message,
            roles.map((role) => ({
                name: role.name,
                value: role,
            })),
        );
    });
};

const selectAccount = async (
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

const createRole = async () => {
    title('Create a new role');
    const roleName = repeatPrompt(
        'Enter the new role name',
        undefined,
        (data) => !Role.fromName(data),
        false,
    );
    const roleDescription = repeatPrompt('Enter the role description');
    const roleRank = +repeatPrompt(
        'Enter the role rank',
        undefined,
        (data) => !isNaN(parseInt(data)),
        false,
    );

    Role.new(roleName, roleDescription, roleRank);

    backToMain(`Role ${roleName} created`);
};

const deleteRole = async () => {
    title('Delete a role');

    const res = await selectRole();
    if (res.isOk()) {
        const isGood = await confirm(
            `Are you sure you want to delete the role ${res.value.name}?`,
        );

        if (isGood) {
            res.value.delete();
            backToMain(`Role ${res.value.name} deleted`);
        } else {
            backToMain('Role not deleted');
        }
    } else {
        backToMain('No roles to delete');
    }
};

const addRole = async () => {
    title('Add a role to an account');
    const roleRes = await selectRole();

    if (roleRes.isOk()) {
        const accountRes = await selectAccount();
        if (accountRes.isOk()) {
            const account = accountRes.value;
            const role = roleRes.value;

            if (account.roles.some((r) => r.name === role.name)) {
                backToMain(
                    `Account ${account.username} already has role ${role.name}`,
                );
            } else {
                account.addRole(role);
                backToMain(
                    `Role ${role.name} added to account ${account.username}`,
                );
            }
        }
    } else {
        backToMain('No roles to add');
    }
};

const removeRole = async () => {
    title('Remove a role from an account');
    const accountRes = await selectAccount();

    if (accountRes.isOk()) {
        const account = accountRes.value;
        const roles = account.roles;
        if (!roles.length) {
            backToMain(`Account ${account.username} has no roles`);
        } else {
            const role = await select<Role>(
                'Select a role to remove',
                roles.map((r) => ({
                    name: r.name,
                    value: r,
                })),
            );

            if (role) {
                account.removeRole(role);
                backToMain(
                    `Role ${role.name} removed from account ${account.username}`,
                );
            } else {
                backToMain('No roles to remove');
            }
        }
    } else {
        backToMain('No accounts to remove roles from');
    }
};

const addPermissions = async () => {
    title('Add permissions to a role');
    const roleRes = await selectRole('Select a role to add permissions to');

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = role.getPermissions();

        const permName = repeatPrompt(
            'Enter the permission name',
            undefined,
            (data) => !perms.some((p) => p === data),
            false,
        );
        const description = repeatPrompt('Enter the permission description');
        role.addPermission(permName as unknown as Permission, description);

        const allPermissions = DB.all('permissions/all');
        const uniqueNames = allPermissions
            .map((p: RolePermission) => p.permission)
            .filter(
                (p: string, i: number, arr: string[]) => arr.indexOf(p) === i,
            );
        const ts = `export type Permission = ${
            uniqueNames
                .map((n) => `'${n}'`)
                .join(' | ')
        };`;
        Deno.writeTextFileSync('./shared/permissions.ts', ts);

        backToMain(`Permission ${permName} added to role ${role.name}`);
    } else {
        backToMain('No roles to add permissions to');
    }
};

const removePermissions = async () => {
    title('Remove permissions from a role');
    const roleRes = await selectRole(
        'Select a role to remove permissions from',
    );

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = role.getPermissions();
        if (!perms.length) {
            backToMain(`Role ${role.name} has no permissions`);
        } else {
            const perm = await select<Permission>(
                'Select a permission to remove',
                perms.map((p) => ({
                    name: p,
                    value: p,
                })),
            );

            if (perm) {
                role.removePermission(perm);
                backToMain(`Permission ${perm} removed from role ${role.name}`);
            } else {
                backToMain('No permissions to remove');
            }
        }
    } else {
        backToMain('No roles to remove permissions from');
    }
};

const verifyAccount = async () => {
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

const main = async () => {
    title('Welcome to the Deno Task Manager!');
    type MainCommands =
        | 'create-role'
        | 'delete-role'
        | 'add-role'
        | 'remove-role'
        | 'add-permissions'
        | 'remove-permissions'
        | 'exit'
        | 'verify-account';

    const data = await select<MainCommands>('Please select a task', [
        {
            name: 'Create a new role',
            value: 'create-role',
        },
        {
            name: 'Delete a role',
            value: 'delete-role',
        },
        {
            name: 'Add a role to an account',
            value: 'add-role',
        },
        {
            name: 'Remove a role from an account',
            value: 'remove-role',
        },
        {
            name: 'Add permissions to a role',
            value: 'add-permissions',
        },
        {
            name: 'Remove permissions from a role',
            value: 'remove-permissions',
        },
        {
            name: 'Verify an account',
            value: 'verify-account',
        },
        {
            name: 'Exit',
            value: 'exit',
        },
    ]);

    switch (data) {
        case 'create-role':
            await attemptAsync(createRole);
            break;
        case 'delete-role':
            await attemptAsync(deleteRole);
            break;
        case 'add-role':
            await attemptAsync(addRole);
            break;
        case 'remove-role':
            await attemptAsync(removeRole);
            break;
        case 'add-permissions':
            await attemptAsync(addPermissions);
            break;
        case 'remove-permissions':
            await attemptAsync(removePermissions);
            break;
        case 'verify-account':
            await attemptAsync(verifyAccount);
            break;
        case 'exit':
            Deno.exit(0);
    }
};

main();
