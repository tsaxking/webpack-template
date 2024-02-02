import { DB } from '../server/utilities/databases.ts';
import { getJSONSync, saveJSONSync } from '../server/utilities/files.ts';
import { uuid } from '../server/utilities/uuid.ts';

type RoleInfoJSON = {
    roles: {
        id: string;
        name: string;
        description: string;
        rank: number;
        permissions: string[];
    }[];
    permissions: {
        permission: string;
        description: string;
    }[];
};

const saveDefault = () => {
    saveJSONSync('role-info', {
        roles: [],
        permissions: [],
    });

    Deno.writeTextFileSync(
        'shared/permissions.ts',
        `export type Permission = '';\nexport type RoleName = '';`,
    );
};

export const resetRoles = () => {
    DB.unsafe.run('DELETE FROM Permissions');
    DB.unsafe.run('DELETE FROM RolePermissions');
    DB.unsafe.run('DELETE FROM Roles');

    const res = getJSONSync<RoleInfoJSON>('role-info');

    if (res.isOk()) {
        let { roles, permissions } = res.value;
        if (!roles || !permissions) {
            // this shouldn't happen, but just in case
            saveDefault();
            roles = [];
            permissions = [];
        }

        for (const p of permissions) {
            DB.unsafe.run(
                `
                INSERT INTO Permissions (
                    permission,
                    description
                ) VALUES (
                    ?, ?
                );
            `,
                p.permission,
                p.description,
            );
        }

        for (const r of roles) {
            DB.run('roles/new', {
                name: r.name,
                rank: r.rank,
                description: r.description,
                id: r.id,
            });

            for (const p of r.permissions) {
                DB.run('permissions/add-to-role', {
                    roleId: r.id,
                    permission: p,
                });
            }
        }

        Deno.writeTextFileSync(
            'shared/permissions.ts',
            `export type Permission = ${
                permissions.length
                    ? permissions.map((p) => `'${p.permission}'`).join(' | ')
                    : "''"
            };\nexport type RoleName = ${
                roles.length
                    ? roles.map((r) => `'${r.name}'`).join(' | ')
                    : "''"
            };`,
        );
    } else {
        saveDefault();
        resetRoles();
    }
};

{
    // do in a block to avoid polluting the global scope and to use the garbage collector
    const res = getJSONSync<RoleInfoJSON>('role-info');
    if (res.isErr()) {
        saveDefault();
    }
}

export const addRole = (name: string, description: string, rank: number) => {
    const id = uuid();

    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        data.roles.push({
            id,
            name,
            description,
            rank,
            permissions: [],
        });

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};

export const addPermission = (permission: string, description: string) => {
    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        data.permissions.push({
            permission,
            description,
        });

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};

export const removeRole = (id: string) => {
    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        data.roles = data.roles.filter((r) => r.id !== id);

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};

export const removePermission = (permission: string) => {
    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        data.permissions = data.permissions.filter(
            (p) => p.permission !== permission,
        );

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};

export const addPermissionToRole = (roleId: string, permission: string) => {
    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        const r = data.roles.find((r) => r.id === roleId);
        if (r) {
            r.permissions.push(permission);
        }

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};

export const removePermissionFromRole = (
    roleId: string,
    permission: string,
) => {
    const res = getJSONSync<RoleInfoJSON>('role-info');

    const whenOk = (data: RoleInfoJSON) => {
        const r = data.roles.find((r) => r.id === roleId);
        if (r) {
            r.permissions = r.permissions.filter((p) => p !== permission);
        }

        saveJSONSync('role-info', data);

        resetRoles();
    };

    if (res.isErr()) {
        saveDefault();
        whenOk(
            res.handle({
                roles: [],
                permissions: [],
            }).value,
        );
    }

    if (res.isOk()) {
        whenOk(res.value);
    }
};
