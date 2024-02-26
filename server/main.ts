import { stdin } from './utilities/stdin.ts';
import { Builder } from './bundler.ts';
import { Colors } from './utilities/colors.ts';
import env from './utilities/env.ts';
import { attemptAsync } from '../shared/check.ts';

const servers = Number(env.NUM_SERVERS) || 1;

const port = Number(env.PORT) || 3000;

const log = (...args: any[]) =>
    console.log(Colors.FgBlue, '[MAIN]', Colors.Reset, ...args, Colors.Reset);


class Child {
    private static currentIndex = 0;

    static send(url: string, options?: RequestInit) {
        const c = Child.children.get(Child.currentIndex);
        if (!c) throw new Error('No children');
        Child.currentIndex++;
        if (Child.currentIndex >= servers) Child.currentIndex = 0;
        return c.send(url, options);
    }

    static async new(i: number) {
        const child = new Child(port, i);
        Child.children.set(i, child);
    }

    static kill() {
        for (const child of Child.children.values()) {
            child.kill();
        }
    }

    static restart() {
        Child.kill();
        Child.start();
    }

    static start() {
        for (let i = 0; i < servers; i++) {
            Child.new(i);
        }
    }

    static readonly children = new Map<number, Child>();

    private readonly child: Deno.ChildProcess;
    private readonly port: number;
    constructor(port: number, i: number) {
        log('Starting server...');
        Child.children.set(i, this);
        this.port = port + i + 1;
        console.log('Starting server on port', this.port);
        this.child = new Deno.Command(Deno.execPath(), {
            args: ['run', '--allow-all', './server/server.ts', '--port=' + this.port],
            stdout: 'inherit',
            stderr: 'inherit',
            stdin: 'inherit',
        }).spawn();
    }

    kill() {
        try {
            this.child.kill();
        } catch (error) {
            console.error(error);
        }
        Child.children.delete(this.port);
    }

    private async send(url: string, options?: RequestInit) {
        return attemptAsync(async () => {
            return await fetch('http://localhost:' + this.port + url, options)
                .catch(e => e);
        });
    }
}

const main = () => {
    const { args } = Deno;
    const builder = new Builder();

    const build = () => {
        builder.build();
        Child.restart();
    };

    build();
    // Child.start();

    if (args.includes('--stdin')) {
        log('Listening for rs and rb');
        stdin.on('rs', () => {
            log('Restarting...');
            Child.restart();
        });

        stdin.on('rb', () => {
            build();
        });
    }

    const watchers: Deno.FsWatcher[] = [];

    if (args.includes('--watch')) {
        builder.watch('./client');
        builder.watch('./shared');

        const watch = async (path: string) => {
            log('Watching', path);
            const watcher = Deno.watchFs(path);
            watchers.push(watcher);
            for await (const event of watcher) {
                log('file change detected.. Restarting server');
                switch (event.kind) {
                    case 'create':
                    case 'modify':
                    case 'remove':
                        Child.restart();
                        break;
                }
            }
        };

        watch('./server');
        watch('./shared');
    }

    const exit = (name: string) => () => {
        log('Received', name, 'signal. Exiting...');
        Child.kill();
        builder.close();
        for (const watcher of watchers) watcher.close();
        Deno.exit();
    }

    Deno.addSignalListener('SIGINT', exit('SIGINT'));
    try {
        Deno.addSignalListener('SIGTERM', exit('SIGTERM'));
        Deno.addSignalListener('SIGQUIT', exit('SIGQUIT'));
        Deno.addSignalListener('SIGHUP', exit('SIGHUP'));
    } catch (e) {
        console.error(e);
    }

    Deno.serve(async (req, info) => {
        const { pathname } = new URL(req.url, 'http://localhost');
        const res = await Child.send(pathname, {
            method: req.method,
            headers: req.headers,
            body: req.body
        });

        console.log(res);

        if (res.isErr()) {
            return new Response(JSON.stringify({
                title: 'Unknown',
                $status: 'Server error',
                code: 500,
                color: 'danger',
                message: 'An unknown error occurred. Please try again later.',
                data: res.error.message
            }));
        }

        if (res.isOk()) {
            const { value } = res;
            if (value.redirected) {
                const pathname = new URL(value.url).pathname;
                return new Response(null, {
                    status: 302,
                    statusText: 'Found',
                    headers: {
                        location: pathname
                    }
                });
            }

            const body = await value.text();

            return new Response(body, {
                status: value.status,
                headers: value.headers
            });
        }

        return new Response(null, {
            status: 500,
            statusText: 'Internal server error'
        });
    });
};

if (import.meta.main) main();
