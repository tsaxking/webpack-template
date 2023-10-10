import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";



export const router = new Route();



router.get('/all', (_req, res) => {
    const balanceCorrections = DB.all('balance-correction/all');

    res.json(balanceCorrections);
});

router.post('/new', (req, res) => {
    const {
        balance,
        bucketId,
        date
    } = req.body;


    const b = DB.get('buckets/from-id', { id: bucketId });

    if (!b) return res.sendStatus('buckets:invalid-id');

    const id = uuid();

    DB.run('balance-correction/new', {
        id,
        balance,
        bucketId,
        date
    });

    res.sendStatus('balance-correction:created');
    req.io.emit('balance-correction:created', {
        id,
        balance,
        bucketId,
        date
    });
});

router.post('/update', (req, res) => {
    const {
        id,
        balance,
        bucketId,
        date
    } = req.body;

    const b = DB.get('buckets/from-id', { id: bucketId });

    if (!b) return res.sendStatus('buckets:invalid-id');

    DB.run('balance-correction/update', {
        id,
        balance,
        bucketId,
        date
    });

    res.sendStatus('balance-correction:updated');
    req.io.emit('balance-correction:updated', {
        id,
        balance,
        bucketId,
        date
    });
});

router.post('/delete', (req, res) => {
    const { id } = req.body;

    DB.run('balance-correction/delete', { id });

    res.sendStatus('balance-correction:deleted');
    req.io.emit('balance-correction:deleted', { id });
});