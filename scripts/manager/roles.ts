import { backToMain } from '../manager.ts';
import Role from '../../server/structure/roles.ts';
import { selectAccount } from './accounts.ts';
import { confirm, repeatPrompt, select } from '../prompt.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { addPermissions, removePermissions } from './permissions.ts';
import { getJSON, saveJSON } from '../../server/utilities/files.ts';
import { RolePermission } from '../../shared/db-types.ts';
import { DB } from '../../server/utilities/databases.ts';

export const selectRole = async (
    message = 'Select a role',
): Promise<Result<Role>> => {
    return attemptAsync(async () => {
        const roles = await Role.all();
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
    const name = repeatPrompt(
        'Enter the new role name',
        undefined,
        (data) => !!Role.fromName(data),
        false,
    );
    const description = repeatPrompt('Enter the role description');
    const rank = +repeatPrompt(
        'Enter the role rank',
        undefined,
        (data) => !isNaN(parseInt(data)),
        false,
    );

    Role.new(name, description, rank);

    backToMain(`Role ${name} created`);
};

export const deleteRole = async () => {
    const res = await selectRole();
    if (res.isOk()) {
        if (!res.value) {
            return backToMain(
                'Failure to find role (this is a bug, please report)',
            );
        }

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

export const addRoleToAccount = async () => {
    const roleRes = await selectRole();

    if (roleRes.isOk()) {
        const accountRes = await selectAccount();
        if (accountRes.isOk()) {
            const account = accountRes.value;
            const role = roleRes.value;

            const roles = await account.getRoles();

            if (roles.some((r) => r.name === role.name)) {
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
        const roles = await account.getRoles();
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

export const saveRolesToJson = async () => {
    const [roles, permissions] = await Promise.all([
        Role.all(),
        Role.getAllPermissions(),
    ]);

    const data = {
        roles: await Promise.all(
            roles.map(async (role) => {
                return {
                    role,
                    permissions: await role.getPermissions(),
                };
            }),
        ),
        permissions,
    };

    const res = await saveJSON('roles', data);

    if (res.isOk()) {
        return backToMain('Roles saved to ./storage/jsons/roles.json');
    }

    console.error(res.error);
    return backToMain('Error saving roles');
};

export const applyRolesFromJson = async () => {
    const currentRoles = await Role.all();
    const currentPermissions = await Role.getAllPermissions();

    if (currentRoles.length || currentPermissions.length) {
        const res = await confirm(
            'This will overwrite all current roles and permissions in the database. Are you sure you want to continue?',
        );
        if (!res) return backToMain('Roles not applied');
    }

    console.log('Loading roles from ./storage/jsons/roles.json');
    const res = await getJSON('roles');
    if (res.isErr()) {
        console.error(res.error);
        return backToMain('Error loading roles');
    }

    const data = res.value as {
        roles: {
            role: Role;
            permissions: RolePermission[];
        }[];
        permissions: RolePermission[];
    };

    if (!data.roles || !data.permissions) {
        return backToMain('Invalid roles data');
    }

    console.log('Applying roles to database');
    const { roles, permissions } = data;
    const deleted = await DB.unsafe.run(`
        DELETE FROM Roles;
        DELETE FROM RolePermissions;
        DELETE FROM Permissions;
    `);

    if (deleted.isErr()) {
        console.error(deleted.error);
        return backToMain('Error applying roles');
    }

    // don't need await from here on out
    for (const r of roles) {
        DB.run('roles/new', {
            id: r.role.id,
            name: r.role.name,
            description: r.role.description,
            rank: r.role.rank,
        });

        for (const p of r.permissions) {
            DB.run('permissions/add-to-role', {
                roleId: r.role.id,
                permission: p.permission,
            });
        }
    }

    for (const p of permissions) {
        DB.unsafe.run(
            `
            INSERT INTO Permissions (
                permission,
                description
            ) VALUES (
                :permission,
                :description
            )
        `,
            p,
        );
    }

    backToMain('Roles applied');
};

export const roles = [
    {
        icon: '📝',
        value: createRole,
        description: 'Create a new role',
    },
    {
        icon: '🗑️',
        value: deleteRole,
        description: 'Delete a role',
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
    {
        icon: '🔒',
        value: addPermissions,
        description: 'Add permissions to a role',
    },
    {
        icon: '🔓',
        value: removePermissions,
        description: 'Remove permissions from a role',
    },
    {
        icon: '💾',
        value: saveRolesToJson,
        description: 'Save roles to ./storage/jsons/roles.json',
    },
    {
        icon: '📥',
        value: applyRolesFromJson,
        description: 'Apply roles from ./storage/jsons/roles.json',
    },
];
