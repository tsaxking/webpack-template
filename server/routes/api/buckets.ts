import { validate } from "../../middleware/data-type.ts";
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

router.post('/new', validate({
    name: (v: any) => typeof v === 'string',
    description: (v: any) => typeof v === 'string',
    type: (v: any) => [ 'debit', 'credit', 'savings' ].indexOf(v) > -1
}), (req, res) => {
    const {
        name,
        description,
        type
    } = req.body;


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

router.post('/update', validate({
    id: (v: any) => typeof v === 'string',
    name: (v: any) => typeof v === 'string',
    description: (v: any) => typeof v === 'string',
    type: (v: any) => [ 'debit', 'credit', 'savings' ].indexOf(v) > -1
}), (req, res) => {
    const {
        id,
        name,
        description,
        type
    } = req.body;

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

router.post('/set-archive-status', validate({
    bucketId: (v: any) => typeof v === 'string',
    archived: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { bucketId, archived } = req.body;

    const b = DB.get('buckets/from-id', { id: bucketId });

    if (!b) {
        return res.sendStatus('buckets:invalid-id');
    }

    DB.run('buckets/set-archive', {
        id: bucketId,
        archived: archived ? 1 : 0
    });

    if (archived) {
        res.sendStatus('buckets:archived');
        req.io.emit('buckets:archived', { bucketId });
    } else {
        res.sendStatus('buckets:restored');
        req.io.emit('buckets:restored', { bucketId });
    }
});