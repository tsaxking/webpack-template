import { DB } from '../../../../server/utilities/database';

(async () => {
    const permissions = await DB.all('permissions/all');

    if (permissions.isErr()) throw permissions.error;

    const res = await DB.unsafe.run(
        DB.Query.build(`
        DROP TABLE IF EXISTS Permissions;
        CREATE TABLE Permissions (
            permission TEXT PRIMARY KEY,
            description TEXT
        );
    `)
    );

    if (res.isOk()) {
        console.log('Permissions table created');
    }

    for (const perm of permissions.value) {
        const res = await DB.unsafe.run(
            DB.Query.build(
                `
            INSERT INTO Permissions (permission, description)
            VALUES (?, ?)
            ON CONFLICT(permission) DO NOTHING
        `,
                perm.permission,
                perm.description || ''
            )
        );

        if (res.isOk()) {
            console.log('Permission added:', perm.permission);
        }
    }

    console.log('Permissions added');

    process.exit(0);
})();
