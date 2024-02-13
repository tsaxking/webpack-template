import { validate } from '../middleware/data-type.ts';
import { Route } from '../structure/app/app.ts';
import Role from '../structure/roles.ts';

export const router = new Route();

router.post('/all', async (req, res) => {
    const roles = await Role.all();
    res.json(await Promise.all(roles.map(async (r) => ({
        ...r,
        permissions: await r.getPermissions()
    }))));
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
    async (req, res) => {},
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
    async (req, res) => {},
);
