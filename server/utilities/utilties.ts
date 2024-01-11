import { EventEmitter } from '../../shared/event-emitter.ts';
import { readLines } from 'https://deno.land/std@0.100.0/io/mod.ts';

export const stdin = new EventEmitter();

(async () => {
    for await (const line of readLines(Deno.stdin)) {
        stdin.emit(line);
    }
})();
