import { validate } from '../middleware/data-type.ts';
import { Route } from '../structure/app/app.ts';

const router = new Route();

export default router;

router.post('/all', async (req, res) => {});
// TODO: implement role routes

router.post('/*', async (req, res) => {
    res.sendStatus('server:not-implemented');
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

router.post<{
    id: string;
}>(
    '/permissions',
    validate({
        id: 'string',
    }),
    async (req, res) => {},
);
