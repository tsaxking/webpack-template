import { backToMain } from '../manager.ts';
import { repeatPrompt, select } from '../prompt.ts';
import { selectRole } from './roles.ts';
import { Permission } from '../../shared/permissions.ts';
import Role from '../../server/structure/roles.ts';
import {
    addPermission,
    addPermissionToRole,
    removePermission,
    removePermissionFromRole,
} from '../set-role-info.ts';

export const addPermissions = async () => {
    const roleRes = await selectRole('Select a role to add permissions to');

    if (roleRes.isOk()) {
        const role = roleRes.value;

        const allPerms = Role.allPermissions;
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

        const perms = role.getPermissions();

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
            addPermission(perm, description);
        }

        addPermissionToRole(role.id, perm);
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
                removePermission(perm);
                removePermissionFromRole(role.id, perm);
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
