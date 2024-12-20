import { DB } from '../../../../utilities/database';
import { Struct } from '../../struct';

export namespace Strategy {
    export const Strategy = new Struct({
        sample: true,
        name: 'Strategy',
        database: DB,
        structure: {
            name: 'text',
            accountId: 'text',
            matchId: 'text',
            customMatch: 'boolean',
            comment: 'text'
        },
        versionHistory: {
            type: 'versions',
            amount: 3
        }
    });

    // must be connected to a strategy
    export const Whiteboard = new Struct({
        sample: true,
        name: 'Whiteboard',
        database: DB,
        structure: {
            name: 'text',
            strategyId: 'text',
            board: 'text' // JSON
        },
        versionHistory: {
            type: 'versions',
            amount: 3
        }
    });
}
