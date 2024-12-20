import { backToMain } from '../manager';
import { confirm } from '../prompt';
import { resolveAll } from '../../shared/check';
import { addPermissions, removePermissions } from './permissions';
import { Permissions } from '../../server/structure/structs/permissions';
import { selectData, structActions } from './structs';
import { selectAccount } from './accounts';

export const createRole = async () => {
    return structActions.new(Permissions.Role);
};

export const selectRole = async () => {
    const roles = (await Permissions.Role.all(false)).unwrap();
    return selectData(roles, 'Select a role...');
};

export const deleteRole = async () => {
    const roles = (await Permissions.Role.all(false)).unwrap();
    const role = await selectData(roles, 'Select a role to delete...');
    if (!role) return backToMain('No role selected');
    const isGood = await confirm(
        `Are you sure you want to delete the role ${role.data.name}?`
    );
    if (isGood) {
        (await role.delete()).unwrap();
        backToMain(`Role ${role.data.name} deleted`);
    } else {
        backToMain('Role not deleted');
    }
};

export const addRoleToAccount = async () => {
    const selectedRole = await selectRole();
    if (!selectedRole) return backToMain('No role selected');

    const selectedAccount = await selectAccount();
    if (!selectedAccount) return backToMain('No account selected');

    const isGood = await confirm(
        `Are you sure you want to add the role ${selectedRole.data.name} to the account ${selectedAccount.data.username}?`
    );

    if (isGood) {
        Permissions.RoleAccount.new({
            role: selectedRole.id,
            account: selectedAccount.id
        });
        return backToMain(
            `Role ${selectedRole.data.name} added to account ${selectedAccount.data.username}`
        );
    }

    return backToMain('Role not added');
};

export const removeRoleFromAccount = async () => {
    const roles = (await Permissions.Role.all(false)).unwrap();
    const account = await selectAccount();
    if (!account) return backToMain('No account selected');
    const accountRoles = (
        await Permissions.RoleAccount.fromProperty('account', account.id, false)
    ).unwrap();

    const filtered = roles.filter(role =>
        accountRoles.some(accountRole => accountRole.data.role === role.id)
    );

    const role = await selectData(
        filtered,
        'Select a role to remove from the account...'
    );
    if (!role) return backToMain('No role selected');

    const isGood = await confirm(
        `Are you sure you want to remove the role ${role.data.name} from the account ${account.data.username}?`
    );

    if (isGood) {
        const roleAccounts = accountRoles.filter(
            accountRole => accountRole.data.role === role.id
        );
        resolveAll(
            await Promise.all(
                roleAccounts.map(roleAccount => roleAccount.delete())
            )
        ).unwrap();
        return backToMain(
            `Role ${role.data.name} removed from account ${account.data.username}`
        );
    }

    return backToMain('Role not removed');
};

export const roles = [
    {
        icon: '📝',
        value: createRole,
        description: 'Create a new role'
    },
    {
        icon: '🗑️',
        value: deleteRole,
        description: 'Delete a role'
    },
    {
        icon: '➕',
        value: addRoleToAccount,
        description: 'Add a role to an account'
    },
    {
        icon: '➖',
        value: removeRoleFromAccount,
        description: 'Remove a role from an account'
    },
    {
        icon: '🔒',
        value: addPermissions,
        description: 'Add permissions to a role'
    },
    {
        icon: '🔓',
        value: removePermissions,
        description: 'Remove permissions from a role'
    }
];
