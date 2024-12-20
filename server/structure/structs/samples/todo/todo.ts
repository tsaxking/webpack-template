import { DB } from '../../../../utilities/database';
import { Struct } from '../../struct';

export namespace TodoList {
    export const Todos = new Struct({
        database: DB,
        name: 'Todos',
        structure: {
            name: 'text',
            done: 'boolean'
        },
        sample: true
    });
}
