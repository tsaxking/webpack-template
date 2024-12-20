import { Struct } from './struct';
import { DB } from '../../utilities/database';

export namespace Logs {
    export const Log = new Struct({
        database: DB,
        name: 'Log',
        structure: {
            account: 'text',
            action: 'text',
            struct: 'text',
            properties: 'text'
        }
    });
}
