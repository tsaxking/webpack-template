import { backToMain } from '../manager.ts';
import { repeatPrompt, select } from '../prompt.ts';
import { selectRole } from './roles.ts';
import { Permission } from '../../shared/permissions.ts';
import Role from '../../server/structure/roles.ts';
import { DB } from '../../server/utilities/databases.ts';

const createPermission = (perm: Permission, description: string) => {
    // will not do anything if the permission already exists
    DB.unsafe.run(
        `
        INSERT INTO permissions (name, description)
        VALUES (?, ?)

        ON CONFLICT(name) DO NOTHING
    `,
        perm,
        description,
    );
};

export const addPermissions = async () => {
    const roleRes = await selectRole('Select a role to add permissions to');

    if (roleRes.isOk()) {
        const role = roleRes.value;

        const allPerms = await Role.getAllPermissions();
        let perm = (await select<Permission>('Select a permission to add', [
            ...allPerms.map((p) => ({
                name: p,
                value: p,
            })),
            {
                name: '[New]',
                value: '$$New$$' as unknown as Permission,
            },
        ])) as Permission | '$$New$$';

        const perms = await role.getPermissions();

        if (perm === '$$New$$') {
            perm = repeatPrompt(
                'Enter the permission name',
                undefined,
                (data) =>
                    !perms.some((p) => p === data) &&
                    !allPerms.some((p) => p === data),
                false,
            ) as unknown as Permission;
            const description = repeatPrompt(
                'Enter the permission description',
            );
            createPermission(perm, description);
        }

        role.addPermission(perm);
        backToMain(`Permission ${perm} added to role ${role.name}`);
    } else {
        backToMain('No roles to add permissions to');
    }
};

export const removePermissions = async () => {
    const roleRes = await selectRole(
        'Select a role to remove permissions from',
    );

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = await role.getPermissions();
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

export const permissions = [
    {
        icon: '📝',
        value: addPermissions,
    },
    {
        icon: '🗑️',
        value: removePermissions,
    },
];
