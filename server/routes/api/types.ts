import { Route } from "../../structure/app/app.ts";
import { DB } from "../../utilities/databases.ts";
import { uuid } from "../../utilities/uuid.ts";
import { validate } from "../../middleware/data-type.ts";

export const router = new Route();



router.post('/get-types', (_req, res) => {
    const types = DB.all('types/all-types');
    const subtypes = DB.all('types/all-subtypes');
    res.json({
        types,
        subtypes
    });
});

router.post('/new-type', validate({
    name: (v: any) => typeof v === 'string'
}), (req, res) => {
    const {
        name
    } = req.body;

    const dateCreated = Date.now();
    const dateModified = dateCreated;
    const id = uuid();

    DB.run('types/new-type', {
        id,
        name,
        dateCreated,
        dateModified
    });

    res.json({
        id,
        name,
        dateCreated,
        dateModified
    });
    // res.sendStatus('transaction-types:type-created');
    req.io.emit('transaction-type:type-created', {
        id,
        name,
        dateCreated,
        dateModified
    });
});

router.post('/new-subtype', validate({
    name: (v: any) => typeof v === 'string',
    typeId: (v: any) => typeof v === 'string',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1
}), (req, res) => {
    const {
        name,
        typeId,
        type
    } = req.body;

    const dateCreated = Date.now();
    const dateModified = dateCreated;
    const id = uuid();

    DB.run('types/new-subtype', {
        id,
        name,
        typeId,
        dateCreated,
        dateModified,
        type
    });

    // res.sendStatus('transaction-types:subtype-created');
    res.json({
        id,
        name,
        typeId,
        dateCreated,
        dateModified,
        type
    });
    req.io.emit('transaction-type:subtype-created', {
        id,
        name,
        typeId,
        dateCreated,
        dateModified,
        type
    });
});

router.post('/update-type', validate({
    id: (v: any) => typeof v === 'string',
    name: (v: any) => typeof v === 'string'
}), (req, res) => {
    const {
        id,
        name
    } = req.body;

    const dateModified = Date.now();

    DB.run('types/update-type', {
        id,
        name,
        dateModified,
        dateCreated: dateModified
    });

    res.sendStatus('transaction-types:type-updated');
    req.io.emit('transaction-types:type-updated', {
        id,
        name,
        dateModified
    });
});

router.post('/update-subtype', validate({
    id: (v: any) => typeof v === 'string',
    name: (v: any) => typeof v === 'string',
    typeId: (v: any) => typeof v === 'string',
    type: (v: any) => typeof v === 'string' && ['withdrawal', 'deposit'].indexOf(v) !== -1
}), (req, res) => {
    const {
        id,
        name,
        typeId,
        type
    } = req.body;

    if (['withdrawal', 'deposit'].indexOf(type) === -1) {
        return res.sendStatus('transaction-types:invalid-type');
    }

    const dateModified = Date.now();

    DB.run('types/update-subtype', {
        id,
        name,
        typeId,
        dateModified,
        dateCreated: dateModified,
        type
    });

    res.sendStatus('transaction-types:subtype-updated');
    req.io.emit('transaction-type:subtype-updated', {
        id,
        name,
        typeId,
        dateModified,
        type
    });
});