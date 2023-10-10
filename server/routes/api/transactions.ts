import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";

export const router = new Route();





router.post('/transactions', (req, res) => {
    const { bucket, from, to } = req.body;

    const transactions = DB.all('transactions/between', {
        bucketId: bucket,
        from,
        to
    });

    res.json(transactions);
});

router.post('/new-transaction', (req, res) => {
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

    if (['withdrawal', 'deposit'].indexOf(type) === -1) {
        return res.sendStatus('transactions:invalid-type');
    }


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

router.post('/update-transaction', (req, res) => {
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

    if (['withdrawal', 'deposit'].indexOf(type) === -1) {
        return res.sendStatus('transactions:invalid-type');
    }

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

router.post('/change-transaction-archive-status', (req, res) => {
    const { id, archived } = req.body;

    DB.run('transactions/set-archive', {
        id,
        archived
    });

    if (archived) {
        res.sendStatus('transactions:archived');
        req.io.emit('transactions:archived', id);
    } else {
        res.sendStatus('transactions:unarchived');
        req.io.emit('transactions:unarchived', id);
    }
});