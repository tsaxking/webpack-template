import { Struct } from '../../struct';
import { DB } from '../../../../utilities/database';

export namespace Finances {
    export const Bucket = new Struct({
        name: 'Bucket',
        database: DB,
        structure: {
            name: 'text',
            type: 'text', // debit, credit, savings, etc.
            description: 'text'
        },
        sample: true
    });

    export const Transaction = new Struct({
        name: 'Transaction',
        database: DB,
        structure: {
            amount: 'integer', // pennies
            type: 'boolean', // true = income, false = expense
            status: 'text',
            bucketId: 'text',
            description: 'text',
            subtypeId: 'text',
            taxDeductible: 'boolean',
            transfer: 'boolean',
            picture: 'text'
        },
        sample: true
    });

    export const Type = new Struct({
        name: 'TransactionType',
        database: DB,
        structure: {
            name: 'text'
        },
        sample: true
    });

    export const SubType = new Struct({
        name: 'TransactionSubType',
        database: DB,
        structure: {
            name: 'text',
            typeId: 'text',
            type: 'boolean' // true = income, false = expense
        },
        sample: true
    });

    export const Subscriptions = new Struct({
        name: 'Subscriptions',
        database: DB,
        structure: {
            name: 'text',
            amount: 'integer',
            type: 'boolean', // true = income, false = expense
            status: 'text',
            startDate: 'text',
            endDate: 'text', // '' = never
            interval: 'text', // hourly, daily, weekly, monthly, yearly
            bucketId: 'text',
            subtypeId: 'text',
            description: 'text',
            taxDeductible: 'boolean'
        },
        sample: true
    });
}
