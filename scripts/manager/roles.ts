import { backToMain } from '../manager.ts';
import Role from '../../server/structure/roles.ts';
import { selectAccount } from './accounts.ts';
import { confirm, repeatPrompt, select } from '../prompt.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { addPermissions, removePermissions } from './permissions.ts';
import { addRole, removeRole } from '../set-role-info.ts';

export const selectRole = async (
    message = 'Select a role',
): Promise<Result<Role>> => {
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

export const createRole = async () => {
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

    addRole(roleName, roleDescription, roleRank);

    backToMain(`Role ${roleName} created`);
};

export const deleteRole = async () => {
    const res = await selectRole();
    if (res.isOk()) {
        const isGood = await confirm(
            `Are you sure you want to delete the role ${res.value.name}?`,
        );

        if (isGood) {
            removeRole(res.value.id);
            backToMain(`Role ${res.value.name} deleted`);
        } else {
            backToMain('Role not deleted');
        }
    } else {
        backToMain('No roles to delete');
    }
};

export const addRoleToAccount = async () => {
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

export const removeRoleFromAccount = async () => {
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

export const roles = [
    {
        icon: '📝',
        value: createRole,
    },
    {
        icon: '🗑️',
        value: deleteRole,
    },
    {
        icon: '➕',
        value: addRoleToAccount,
    },
    {
        icon: '➖',
        value: removeRoleFromAccount,
    },
    {
        icon: '🔒',
        value: addPermissions,
    },
    {
        icon: '🔓',
        value: removePermissions,
    },
];
