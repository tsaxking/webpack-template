import { validate } from '../middleware/data-type';
import { Route } from '../structure/app/app';
import Role from '../structure/roles';
import { Permission } from '../../shared/permissions';

export const router = new Route();

router.post('/all', async (req, res) => {
    const roles = await Role.all();
    res.json(
        await Promise.all(
            roles.map(async r => ({
                ...r,
                permissions: await r.getPermissions()
            }))
        )
    );
});

router.post('/all-permissions', async (_req, res) => {
    const perms = await Role.getAllPermissions();

    res.json(perms);
});

router.post<{
    name: string;
    description: string;
    rank: number;
}>(
    '/new',
    validate({
        name: 'string',
        description: 'string',
        rank: 'number'
    }),
    async (req, res) => {
        const { name, description, rank } = req.body;

        const roles = await Role.all();
        if (roles.find(r => r.name === name)) {
            return res.sendStatus('roles:already-exists');
        }

        const role = Role.new(name, description, rank);

        res.sendStatus('roles:new');

        req.io.emit('roles:new', role);
    }
);

router.post<{
    id: string;
    name: string;
    description: string;
    rank: number;
}>(
    '/update',
    validate({
        id: 'string',
        name: 'string',
        description: 'string',
        rank: 'number'
    }),
    async (req, res) => {
        const { id, name, description, rank } = req.body;
        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');

        role.name = name;
        role.description = description;
        role.rank = rank;
        role.save();

        res.sendStatus('roles:updated', role);
        req.io.emit('roles:update', role);
    }
);

router.post<{
    id: string;
}>(
    '/delete',
    validate({
        id: 'string'
    }),
    async (req, res) => {
        const { id } = req.body;
        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');
        if (role.name === 'admin') {
            return res.sendStatus('roles:cannot-edit-admin');
        }

        role.delete();

        res.sendStatus('roles:deleted', role);
        req.io.emit('roles:delete', role);
    }
);

router.post<{
    id: string;
    permission: string;
}>(
    '/add-permission',
    validate({
        id: 'string',
        permission: 'string'
    }),
    async (req, res) => {
        const { id, permission } = req.body;
        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');
        if (role.name === 'admin') {
            return res.sendStatus('roles:cannot-edit-admin');
        }

        const perms = await role.getPermissions();

        if (perms.find(p => p.permission === permission)) {
            // permission already exists on role
            return res.sendStatus('permissions:error');
        }

        const p = await Role.getAllPermissions();

        if (!p.find(p => p.permission === permission)) {
            return res.sendStatus('permissions:not-found');
        }

        await role.addPermission(permission as Permission);

        res.sendStatus('roles:added-permission', {
            id: role.id,
            permission
        });

        req.io.emit('roles:added-permission', {
            roleId: role.id,
            permissions: await role.getPermissions()
        });
    }
);

router.post<{
    id: string;
    permission: string;
}>(
    '/remove-permission',
    validate({
        id: 'string',
        permission: 'string'
    }),
    async (req, res) => {
        const { id, permission } = req.body;

        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');
        if (role.name === 'admin') {
            return res.sendStatus('roles:cannot-edit-admin');
        }

        const perms = await role.getPermissions();

        if (!perms.find(p => p.permission === permission)) {
            return res.sendStatus('permissions:error');
        }

        await role.removePermission(permission as Permission);

        res.sendStatus('roles:removed-permission', {
            id: role.id,
            permission
        });

        req.io.emit('roles:added-permission', {
            roleId: role.id,
            permissions: await role.getPermissions()
        });
    }
);
