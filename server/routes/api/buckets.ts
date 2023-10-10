import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";


export const router = new Route();




router.post('/all', (_req, res) => {
    const buckets = DB.all('buckets/all');

    res.json(buckets);
});

router.post('/archived', (_req, res) => {
    const buckets = DB.all('buckets/archived');

    res.json(buckets);
});

router.post('/new', (req, res) => {
    const {
        name,
        description,
        type
    } = req.body;

    if ([ 'debit', 'credit', 'savings' ].indexOf(type) === -1) {
        return res.sendStatus('buckets:invalid-type');
    }

    const created = Date.now();
    const id = uuid();

    DB.run('buckets/new', {
        id,
        name,
        description,
        type,
        created
    });

    res.sendStatus('buckets:created');
    req.io.emit('buckets:created', {
        id,
        name,
        description,
        type,
        created
    });
});

router.post('/update', (req, res) => {
    const {
        id,
        name,
        description,
        type
    } = req.body;

    if ([ 'debit', 'credit', 'savings' ].indexOf(type) === -1) {
        return res.sendStatus('buckets:invalid-type');
    }

    const b = DB.get('buckets/from-id', { id });

    if (!b) {
        return res.sendStatus('buckets:invalid-id');
    };

    DB.run('buckets/update', {
        id,
        name,
        description,
        type,
        created: b.created
    });

    res.sendStatus('buckets:updated');
    req.io.emit('buckets:updated', {
        id,
        name,
        description,
        type,
        created: b.created
    });
});

router.post('/set-archive-status', (req, res) => {
    const { bucketId, status } = req.body;

    const b = DB.get('buckets/from-id', { id: bucketId });

    if (!b) {
        return res.sendStatus('buckets:invalid-id');
    }

    DB.run('buckets/set-archive', {
        id: bucketId,
        archived: status ? 1 : 0
    });

    if (status) {
        res.sendStatus('buckets:archived');
        req.io.emit('buckets:archived', { bucketId });
    } else {
        res.sendStatus('buckets:unarchived');
        req.io.emit('buckets:unarchived', { bucketId });
    }
});