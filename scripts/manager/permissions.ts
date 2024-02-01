import { backToMain } from '../manager.ts';
import { repeatPrompt, select } from '../prompt.ts';
import { selectRole } from './roles.ts';
import { Permission } from '../../shared/permissions.ts';
import { DB } from '../../server/utilities/databases.ts';
import { RolePermission } from '../../shared/db-types.ts';

export const addPermissions = async () => {
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
