import { validate } from "../../middleware/data-type.ts";
import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";

export const router = new Route();



router.get('/active', (_req, res) => {
    const miles = DB.all('miles/active');

    res.json(miles);
});

router.post('/archived', (_req, res) => {
    const miles = DB.all('miles/archived');

    res.json(miles);
});

router.post('/new', validate({
    amount: (v: any) => typeof v === 'number',
    date: (v: any) => typeof v === 'number'
}), (req, res) => {
    const { amount, date } = req.body;

    const id = uuid();

    DB.run('miles/new', {
        id,
        amount,
        date
    });

    res.sendStatus('miles:created');
    req.io.emit('miles:created', {
        id,
        amount,
        date
    });
});

router.post('/miles-update', validate({
    amount: (v: any) => typeof v === 'number',
    date: (v: any) => typeof v === 'number',
    id: (v: any) => typeof v === 'string'
}), (req, res) => {
    const { id, amount, date } = req.body;


    const m = DB.get('miles/from-id', { id });
    if (!m) return res.sendStatus('miles:invalid-id');

    DB.run('miles/update', {
        id,
        amount,
        date
    });

    res.sendStatus('miles:updated');
    req.io.emit('miles:updated', {
        id,
        amount,
        date
    });
});

router.post('/set-archive',validate({
    id: (v: any) => typeof v === 'string',
    archive: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { id, archive } = req.body;

    const m = DB.get('miles/from-id', { id });
    if (!m) return res.sendStatus('miles:invalid-id');

    DB.run('miles/set-archive', {
        id,
        archived: archive ? 1 : 0
    });

    if (archive) {
        res.sendStatus('miles:archived');
        req.io.emit('miles:archived', { id });
    } else {
        res.sendStatus('miles:restored');
        req.io.emit('miles:restored', { id });
    }
});