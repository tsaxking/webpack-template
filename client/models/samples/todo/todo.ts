import { socket } from '../../../utilities/socket';
import { Struct } from '../../struct';

export namespace TodoList {
    export const Todos = new Struct({
        socket,
        name: 'Todos',
        structure: {
            name: 'text',
            done: 'boolean'
        }
    });
}
