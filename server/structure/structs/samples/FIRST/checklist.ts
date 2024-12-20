import { DB } from '../../../../utilities/database';
import { Struct } from '../../struct';

export namespace Checklist {
    export const Checklist = new Struct({
        database: DB,
        name: 'Checklist',
        structure: {
            name: 'text',
            eventKey: 'text',
            description: 'text'
        },
        sample: true
    });

    export const ChecklistItem = new Struct({
        database: DB,
        name: 'ChecklistItem',
        structure: {
            checklistId: 'text',
            name: 'text',
            interval: 'text' // in matches
        },
        sample: true
    });

    export const ChecklistAssignment = new Struct({
        database: DB,
        name: 'ChecklistAssignment',
        structure: {
            itemId: 'text',
            accountId: 'text'
        },
        sample: true
    });

    export const ChecklistResponses = new Struct({
        database: DB,
        name: 'ChecklistResponses',
        structure: {
            itemId: 'text',
            matchId: 'text',
            accountId: 'text'
        },
        sample: true
    });

    ChecklistResponses.bypass(
        '*',
        (account, data) => account.id === data?.data.accountId
    );
}
