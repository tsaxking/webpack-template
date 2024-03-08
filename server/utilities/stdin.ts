import { EventEmitter } from '../../shared/event-emitter';

/**
 * Emits data from the stdin (on enter)
 * @date 3/8/2024 - 5:58:40 AM
 *
 * @type {*}
 */
export const stdin = new EventEmitter();

// {
// in its own scope to avoid polluting the global scope
// if (process.argv.includes('--stdin')) {
process.stdin.on('data', data => {
    const str = data.toString().trim();
    stdin.emit(str);
});
// }
// }
