import { EventEmitter } from '../../shared/event-emitter.ts';

export const stdin = new EventEmitter();
(async () => {
    if (!Deno.args.includes('--allow-stdin')) return;
    const decoder = new TextDecoder();

    const close = () => Deno.stdin.close();

    stdin.on('close', close);

    Deno.addSignalListener('SIGINT', close);

    for await (const chunk of Deno.stdin.readable) {
        const text = decoder.decode(chunk);
        stdin.emit('data', text);
        stdin.emit(text);
    }
})();
