import { EventEmitter } from '../../shared/event-emitter.ts';
import { readLines } from 'https://deno.land/std@0.100.0/io/mod.ts';

export const stdin = new EventEmitter();
(async () => {
    if (!Deno.args.includes('--allow-stdin')) return;
    for await (const line of readLines(Deno.stdin)) {
        stdin.emit(line);
        stdin.emit('data', line);
    }
})();
