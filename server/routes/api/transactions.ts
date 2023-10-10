import { validate } from "../../middleware/data-type.ts";
import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";

export const router = new Route();





router.post('/transactions', validate({
    bucket: (v: any) => typeof v === 'string',
    from: (v: any) => typeof v === 'number',
    to: (v: any) => typeof v === 'number'
}), (req, res) => {
    const { bucket, from, to } = req.body;

    const transactions = DB.all('transactions/between', {
        bucketId: bucket,
        from,
        to
    });

    res.json(transactions);
});

router.post('/new-transaction', validate({
    amount: (v: any) => typeof v === 'number',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1,
    status: (v: any) => typeof v === 'string',
    date: (v: any) => typeof v === 'number',
    bucketId: (v: any) => typeof v === 'string',
    description: (v: any) => typeof v === 'string',
    subtypeId: (v: any) => typeof v === 'string',
    taxDeductible: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { 
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible
    } = req.body;


    const id = uuid();

    DB.run('transactions/new', {
        id,
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible,
        picture: null
    });

    res.sendStatus('transactions:created');

    req.io.emit('transactions:created', {
        id,
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible,
        picture: null
    });
});

router.post('/update-transaction', validate({
    id: (v: any) => typeof v === 'string',
    amount: (v: any) => typeof v === 'number',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1,
    status: (v: any) => typeof v === 'string',
    date: (v: any) => typeof v === 'number',
    bucketId: (v: any) => typeof v === 'string',
    description: (v: any) => typeof v === 'string',
    subtypeId: (v: any) => typeof v === 'string',
    taxDeductible: (v: any) => typeof v === 'boolean'
}),  (req, res) => {
    const { 
        id,
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible
    } = req.body;

    DB.run('transactions/update', {
        id,
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible,
        picture: null
    });

    res.sendStatus('transactions:updated');

    req.io.emit('transactions:updated', {
        id,
        amount,
        type,
        status,
        date,
        bucketId,
        description,
        subtypeId,
        taxDeductible
    });
});

router.post('/change-transaction-archive-status', validate({
    id: (v: any) => typeof v === 'string',
    archive: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { id, archive } = req.body;

    DB.run('transactions/set-archive', {
        id,
        archived: archive ? 1 : 0
    });

    if (archive) {
        res.sendStatus('transactions:archived');
        req.io.emit('transactions:archived', id);
    } else {
        res.sendStatus('transactions:unarchived');
        req.io.emit('transactions:unarchived', id);
    }
});