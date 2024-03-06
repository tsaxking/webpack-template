import { EventEmitter } from '../../shared/event-emitter';

export const stdin = new EventEmitter();

{
    // in its own scope to avoid polluting the global scope
    if (process.argv.includes('--stdin')) {
        process.stdin.on('data', key => {
            stdin.emit(key.toString());
        });
    }
}
