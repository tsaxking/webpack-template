import { EventEmitter } from '../../shared/event-emitter.ts';
import { readLines } from 'https://deno.land/std@0.100.0/io/mod.ts';

export const stdin = new EventEmitter();
(async () => {
    if (!Deno.args.includes('--stdin')) return;
    console.log('Listening for stdin');
    const lines = readLines(Deno.stdin);
    const close = () => Deno.stdin.close();

    Deno.addSignalListener('SIGINT', close);
    // Deno.addSignalListener('SIGTERM', close);
    // Deno.addSignalListener('SIGHUP', close);
    // Deno.addSignalListener('SIGQUIT', close);

    for await (const line of lines) {
        stdin.emit(line);
        stdin.emit('data', line);
    }
})();
