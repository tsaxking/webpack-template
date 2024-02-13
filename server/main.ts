import { EventEmitter } from '../shared/event-emitter.ts';
import { stdin } from './utilities/stdin.ts';
import { Builder } from './bundler.ts';


const main = () => {
    const { args } = Deno;
    const builder = new Builder();
    builder.build();
    
    const start = (): Deno.ChildProcess => {
        console
        const child = new Deno.Command(Deno.execPath(), {
            args: ['run', '--allow-all', './server/server.ts'],
            stdout: 'inherit',
            stderr: 'inherit',
        }).spawn();

        // child.stderr.pipeTo(Deno.stderr.writable);
        // child.stdout.pipeTo(Deno.stdout.writable);
        return child;
    }



    let child = start();

    const restart = (child: Deno.ChildProcess): Deno.ChildProcess => {
        try {
            child.kill();
            console.log('Terminated server');
            // child.stdin.close();
            // child.stderr.cancel();
        } catch (error) {
            console.error('Failed to kill server', error);
        }
        return start();
    }

    if (args.includes('--stdin')) {
        console.log('Listening for rs and rb');
        stdin.on('rs', () => {
            console.log('Restarting...');
            child = restart(child);
        });

        stdin.on('rb', () => {
            console.log('Rebuilding...');
            builder.build();
        });
    }

    const watchers: Deno.FsWatcher[] = [];

    if (args.includes('--watch')) {
        builder.watch('./client');
        builder.watch('./shared');

        const watch = async (path: string) => {
            console.log('Watching', path);
            const watcher = Deno.watchFs(path);
            watchers.push(watcher);
            for await (const event of watcher) {
                console.log('file change detected.. Restarting server');
                switch (event.kind) {
                    case 'create':
                    case 'modify':
                    case 'remove':
                        child = restart(child);
                        break;
                }
            }
        }

        watch('./server');
        watch('./shared');
    }

    Deno.addSignalListener('SIGINT', () => {
        child.kill();
        builder.close();
        for (const watcher of watchers) watcher.close();
        Deno.exit();
    });
}

if (import.meta.main) main();