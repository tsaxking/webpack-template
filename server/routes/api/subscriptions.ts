import { validate } from "../../middleware/data-type.ts";
import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";


export const router = new Route();

router.post('/all', (_req, res) => {
    const subs = DB.all('subscriptions/active');

    res.json(subs);
});

router.post('/archived', (_req, res) => {
    const subs = DB.all('subscriptions/archived');

    res.json(subs);
});

router.post('/from-bucket', validate({
    bucketId: (v: any) => typeof v === 'string'
}), (req, res) => {
    const { bucketId } = req.body;

    const subs = DB.all('subscriptions/from-bucket', {
        bucketId
    });

    res.json(subs);
});

router.post('/new', validate({
    bucketId: (v: any) => typeof v === 'string',
    name: (v: any) => typeof v === 'string',
    amount: (v: any) => typeof v === 'number',
    interval: (v: any) => typeof v === 'number',
    taxDeductible: (v: any) => typeof v === 'boolean',
    description: (v: any) => typeof v === 'string',
    picture: (v: any) => typeof v === 'string',
    startDate: (v: any) => typeof v === 'string',
    endDate: (v: any) => typeof v === 'string',
    subtypeId: (v: any) => typeof v === 'string'
}), (req, res) => {
    const {
        bucketId,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId
    } = req.body;

    const id = uuid();

    DB.run('subscriptions/new', {
        id,
        bucketId,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId
    });

    res.sendStatus('subscriptions:created');
    req.io.emit('subscriptions:created', {
        id,
        bucketId,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId
    });
});

router.post('/set-archive', validate({
    id: (v: any) => typeof v === 'string',
    archive: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { id, archive } = req.body;

    const sub = DB.get('subscriptions/from-id', {
        id
    });

    if (!sub) {
        return res.sendStatus('subscriptions:invalid-id');
    }

    DB.run('subscriptions/set-archive', {
        id,
        archived: archive ? 1 : 0
    });

    if (archive) {
        res.sendStatus('subscriptions:archived');
        req.io.emit('subscriptions:archived', id);
    } else {
        res.sendStatus('subscriptions:restored');
        req.io.emit('subscriptions:restored', id);
    }
});

router.post('/update', validate({
    id: (v: any) => typeof v === 'string',
    name: (v: any) => typeof v === 'string',
    amount: (v: any) => typeof v === 'number',
    interval: (v: any) => typeof v === 'number',
    taxDeductible: (v: any) => typeof v === 'boolean',
    description: (v: any) => typeof v === 'string',
    picture: (v: any) => typeof v === 'string',
    startDate: (v: any) => typeof v === 'string',
    endDate: (v: any) => typeof v === 'string',
    subtypeId: (v: any) => typeof v === 'string',
    bucketId: (v: any) => typeof v === 'string'
}), (req, res) => {
    const {
        id,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId,
        bucketId
    } = req.body;


    const sub = DB.get('subscriptions/from-id', {
        id
    });

    if (!sub) {
        return res.sendStatus('subscriptions:invalid-id');
    }



    DB.run('subscriptions/update', {
        id,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId,
        bucketId
    });

    res.sendStatus('subscriptions:updated');
    req.io.emit('subscriptions:updated', {
        id,
        name,
        amount,
        interval,
        taxDeductible,
        description,
        picture,
        startDate,
        endDate,
        subtypeId,
        bucketId
    });
});