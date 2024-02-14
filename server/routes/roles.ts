import { validate } from '../middleware/data-type.ts';
import { Route } from '../structure/app/app.ts';
import Role from '../structure/roles.ts';
import { Permission } from '../../shared/permissions.ts';

export const router = new Route();

router.post('/all', async (req, res) => {
    const roles = await Role.all();
    res.json(await Promise.all(roles.map(async (r) => ({
        ...r,
        permissions: await r.getPermissions()
    }))));
});

router.post('/all-permissions', async (_req, res) => {
    const perms = await Role.getAllPermissions();

    res.json(perms);
});

router.post<{
    name: string;
    description: string;
}>(
    '/new',
    validate({
        name: 'string',
        description: 'string',
    }),
    async (req, res) => {},
);

router.post<{
    id: string;
    name: string;
    description: string;
}>(
    '/update',
    validate({
        id: 'string',
        name: 'string',
        description: 'string',
    }),
    async (req, res) => {},
);

router.post<{
    id: string;
}>(
    '/delete',
    validate({
        id: 'string',
    }),
    async (req, res) => {},
);

router.post<{
    id: string;
    permission: string;
}>(
    '/add-permission',
    validate({
        id: 'string',
        permission: 'string',
    }),
    async (req, res) => {
        const { id, permission } = req.body;
        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');

        const perms = await role.getPermissions();

        if (perms.find(p => p.permission === permission)) {
            return res.sendStatus('permissions:error');
        }

        const p = await Role.getAllPermissions();

        if (!p.find(p => p.permission === permission)) {
            return res.sendStatus('permissions:not-found');
        }

        await role.addPermission(permission as Permission);

        res.sendStatus('permissions:added');

        req.io.emit('role:updated', {
            id: role.id,
            permissions: await role.getPermissions()
        });
    },
);

router.post<{
    id: string;
    permission: string;
}>(
    '/remove-permission',
    validate({
        id: 'string',
        permission: 'string',
    }),
    async (req, res) => {
        const { id, permission } = req.body;

        const role = await Role.fromId(id);

        if (!role) return res.sendStatus('role:not-found');

        const perms = await role.getPermissions();

        if (!perms.find(p => p.permission === permission)) {
            return res.sendStatus('permissions:error');
        }

        await role.removePermission(permission as Permission);

        res.sendStatus('permissions:removed');

        req.io.emit('role:updated', {
            id: role.id,
            permissions: await role.getPermissions()
        });
    },
);
