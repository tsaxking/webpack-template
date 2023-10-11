import { validate } from "../../middleware/data-type.ts";
import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";
import { fileStream } from '../../middleware/stream.ts'

export const router = new Route();





router.post('/search', validate({
    bucket: (v: any) => typeof v === 'string',
    from: (v: any) => typeof v === 'string',
    to: (v: any) => typeof v === 'string'
}), (req, res) => {
    const { bucket, from, to } = req.body;

    const transactions = DB.all('transactions/from-bucket', {
        bucket
    });

    const filtered = transactions.filter(t => {
        return +t.date >= +from && +t.date <= +to;
    });

    res.stream(filtered.map(t => JSON.stringify(t)));
});

router.post('/new', validate({
    amount: (v: any) => typeof v === 'number',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1,
    status: (v: any) => ['pending' , 'completed', 'failed'].indexOf(v) !== -1,
    date: (v: any) => typeof v === 'string',
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
        taxDeductible
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
        taxDeductible
    });
});

router.post('/update', validate({
    id: (v: any) => typeof v === 'string',
    amount: (v: any) => typeof v === 'number',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1,
    status: (v: any) => ['pending' , 'completed', 'failed'].indexOf(v) !== -1,
    date: (v: any) => typeof v === 'string',
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

    
    const t = DB.get('transactions/from-id', { id });

    if (!t) {
        return res.sendStatus('transactions:invalid-id');
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
        taxDeductible
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

    const t = DB.get('transactions/from-id', { id });

    if (!t) {
        return res.sendStatus('transactions:invalid-id');
    }

    DB.run('transactions/set-archive', {
        id,
        archived: archive ? 1 : 0
    });

    if (archive) {
        res.sendStatus('transactions:archived');
        req.io.emit('transactions:archived', id);
    } else {
        res.sendStatus('transactions:restored');
        req.io.emit('transactions:restored', id);
    }
});

router.post('/change-picture', validate({
    id: (v: any) => typeof v === 'string'
}), fileStream({
    extensions: ['png', 'jpg', 'jpeg'],
    maxFileSize: 1024 * 1024 * 5 // 5MB
}), (req, res) => {
    const [file] = req.files;

    if (!file) return res.sendStatus('files:no-files');

    const { id: fileId } = file;
    const { id: transactionId } = req.body;

    const t = DB.get('transactions/from-id', { id: transactionId });

    if (!t) {
        return res.sendStatus('transactions:invalid-id');
    }

    DB.run('transactions/update-picture', {
        id: transactionId,
        picture: fileId
    });

    res.sendStatus('transactions:picture-updated');
    req.io.emit('transactions:picture-updated', {
        id: transactionId,
        picture: fileId
    });
});

router.post('/transfer', validate({
    amount: (v: any) => typeof v === 'number',
    status: (v: any) => ['pending' , 'completed', 'failed'].indexOf(v) !== -1,
    date: (v: any) => typeof v === 'number',
    from: (v: any) => typeof v === 'string',
    to: (v: any) => typeof v === 'string',
    description: (v: any) => typeof v === 'string',
    subtypeId: (v: any) => typeof v === 'string',
    taxDeductible: (v: any) => typeof v === 'boolean'
}), (req, res) => {
    const { 
        amount,
        status,
        date,
        from,
        to,
        description,
        subtypeId,
        taxDeductible
    } = req.body;

    const fromId = uuid();
    const toId = uuid();

    DB.run('transactions/new', {
        amount: amount,
        type: 'withdrawal',
        status,
        date,
        bucketId: from,
        description,
        subtypeId,
        taxDeductible,
        id: fromId
    });
    DB.run('transactions/new', {
        amount: amount,
        type: 'withdrawal',
        status,
        date,
        bucketId: from,
        description,
        subtypeId,
        taxDeductible,
        id: toId
    });

    res.sendStatus('transactions:created');
    req.io.emit('transactions:created', {
        amount: amount,
        type: 'withdrawal',
        status,
        date,
        bucketId: from,
        description,
        subtypeId,
        taxDeductible,
        id: fromId
    });
    req.io.emit('transactions:created', {
        amount: amount,
        type: 'withdrawal',
        status,
        date,
        bucketId: from,
        description,
        subtypeId,
        taxDeductible,
        id: toId
    });
});