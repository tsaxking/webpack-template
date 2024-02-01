import { DB } from '../../../../server/utilities/databases.ts';
import { addRole, addPermission, addPermissionToRole } from '../../../../scripts/set-role-info.ts';

const permissions = DB.unsafe.all('SELECT * FROM Permissions') as {
    roleId: string;
    permission: string;
}[];

const roles = DB.all('roles/all');

DB.unsafe.run(`
    CREATE TABLE IF NOT EXISTS RolePermissions (
        roleId TEXT NOT NULL,
        permission TEXT NOT NULL
    );
`);

DB.unsafe.run(`
ALTER TABLE Permissions ADD COLUMN description TEXT DEFAULT '';
`);

DB.unsafe.run(`
ALTER TABLE Permissions DROP COLUMN roleId;
`);

const rolePermissionsObj = {
    roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        rank: r.rank,
        permissions: permissions.filter((p) => p.roleId === r.id).map((p) =>
            p.permission
        ).filter((p, i, arr) => arr.indexOf(p) === i),
    })),
    permissions: permissions.map((p) => p.permission).filter((p, i, arr) =>
        arr.indexOf(p) === i
    ),
};

for (const role of rolePermissionsObj.roles) {
    addRole(role.name, role.description, role.rank);
    for (const permission of role.permissions) {
        addPermissionToRole(role.id, permission);
    }
}

for (const permission of rolePermissionsObj.permissions) {
    addPermission(permission, '');
}