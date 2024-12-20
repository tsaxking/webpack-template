import { Permissions } from '../../server/structure/structs/permissions';
import { backToMain } from '../manager';
import { select, multiSelect } from '../prompt';
import { selectRole } from './roles';
import { selectStruct } from './structs';
import { DataAction, PropertyAction } from '../../shared/struct';

export const selectPermission = async () => {
    return select<DataAction | PropertyAction>('Select a permission...', [
        DataAction.Create,
        DataAction.Delete,
        DataAction.Archive,
        DataAction.RestoreArchive,
        DataAction.DeleteVersion,
        DataAction.RestoreVersion,
        PropertyAction.Read,
        PropertyAction.Update
    ]);
};

export const addPermissions = async () => {
    const role = await selectRole();
    if (!role) return backToMain('No role selected');

    const current = Permissions.DataPermission.parse(
        String(role.data.permissions)
    ).unwrap();

    const struct = await selectStruct(
        `Select a struct to give ${role.data.name} permissions to...`
    );
    if (!struct) return backToMain('No struct selected');

    const permission = await selectPermission();

    if (
        permission === PropertyAction.Read ||
        permission === PropertyAction.Update
    ) {
        // select properties to apply
        const keys = Object.keys(struct.data.structure);
        const properties = await multiSelect(
            `Select properties to let ${role.data.name} ${permission}...}`,
            keys
        );

        const dps = properties.map(
            p =>
                new Permissions.DataPermission(permission, struct.name, keys[p])
        );

        current.push(...dps);
    } else {
        const dp = new Permissions.DataPermission(permission, struct.name);
        current.push(dp);
    }

    (
        await role.update({
            permissions: Permissions.DataPermission.stringify(current).unwrap()
        })
    ).unwrap();

    return backToMain(`Permissions added to ${role.data.name}`);
};

export const removePermissions = async () => {
    const role = await selectRole();
    if (!role) return backToMain('No role selected');

    const current = Permissions.DataPermission.parse(
        String(role.data.permissions)
    ).unwrap();

    const selected = await multiSelect(
        'Select permissions to remove...',
        current.map(p => p.toString())
    );

    const toKeep = current.filter((_, i) => !selected.includes(i));

    (
        await role.update({
            permissions: Permissions.DataPermission.stringify(toKeep).unwrap()
        })
    ).unwrap();

    return backToMain(`Permissions removed from ${role.data.name}`);
};

export const permissions = [
    {
        icon: '📝',
        value: addPermissions,
        description:
            "Adds permissions to a role, and creates a permission if one doesn't exist"
    },
    {
        icon: '🗑️',
        value: removePermissions,
        description: 'Removes permissions from a role'
    }
];
