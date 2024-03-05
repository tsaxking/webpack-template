import { EventEmitter } from "../../shared/event-emitter";


export const stdin = new EventEmitter();

{
    if (process.argv.includes('--stdin')) {
        process.stdin.on('data', (data) => {
            const str = data.toString().trim();
            stdin.emit(str);
        });
    }
}