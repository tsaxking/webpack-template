import { Builder } from './bundler';
import { Colors } from './utilities/colors';
import { deleteDeps, pullDeps } from '../scripts/pull-deps';
import { Worker } from "worker_threads";
import env from "./utilities/env";
import { stdin } from './utilities/stdin';
import { SocketWrapper } from './structure/socket';
import { App } from './structure/app/app';
import { request } from './utilities/request';
import { StatusCode } from '../shared/status-messages';

class Server {
    static readonly workers: Server[] = [];
    static current: number = 0;

    static get(): Server {
        Server.current++;
        if (Server.current >= Server.workers.length) {
            Server.current = 0;
        }
        return Server.workers[Server.current];
    }

    static start() {
        const workers = Server.workers.values();
        for (const worker of workers) {
            worker.start();
        }
    }
    static kill() {
        const workers = Server.workers.values();
        for (const worker of workers) {
            worker.kill();
        }
    }
    static restart() {
        Server.kill();
        Server.start();
    }

    private worker?: Worker;

    constructor(public readonly port: number, public readonly io: SocketWrapper) {
        Server.workers.push(this);
    }

    start() {
        log('Starting server on port', this.port);
        this.worker = new Worker(
            './server/worker.js', 
            {
            workerData: {
                path: './server.ts',
                port: this.port
            },
            // stdin: true,
            // stdout: true,
            // stderr: true,
        });

        this.worker.on('exit', (code) => {
            log('Server exited with code', code);
        });

        type M = {
            socket: boolean;
            event: string;
            data: unknown;
            to?: string;
        };

        this.worker.on('message', (msg: M) => {
            if (msg.socket) {
                if (msg.to) {
                    this.io.to(msg.to).emit(msg.event, msg.data);
                } else {
                    this.io.emit(msg.event, msg.data);
                }
            }
        });
    }

    kill() {
        if (this.worker) {
            log('Killing server on port', this.port);
            this.worker.terminate();
        }
    }
}

const log = (...args: unknown[]) =>
    console.log(
        Colors.FgBlue,
        '[Main]',
        Colors.FgMagenta,
        new Date().toISOString(),
        Colors.Reset,
        ...args
    );

const main = async () => {
    const res = await pullDeps();
    if (res.isErr()) throw res.error;

    const app = new App(
        Number(env.PORT) || 3000,
        env.DOMAIN || 'http://localhost:3000',
    );
    const io = new SocketWrapper(app);

    // force the app to have the io, even though it's 
    Object.assign(app, { io });

    if (!env.NUM_SERVERS) console.warn('NUM_SERVERS not set, defaulting to 1');
    const servers = Number(env.NUM_SERVERS) || 1;
    for (let i = 0; i < servers; i++) new Server(Number(env.PORT) + i + 1, io);

    app.use('/*', async (req, res) => {
        const server = Server.get();
        log('Request:', req.originalUrl, req.method, 'to', server.port);
        const result = await request(
            'http://localhost:' + server.port + req.originalUrl,
            {
                method: req.method,
                headers: req.req.headers,
                data: req.body,
                timeout: 1000
            }
        );

        // console.log('Result:', result);
        if (result.isOk()) {
            const { status, headers, data } = result.value;

            res.status(status as StatusCode);

            for (const key in headers) {
                res.header(key, headers[key]);
            }

            return res.send(data);
        }
        if (result.isErr()) {
            return res.sendStatus('unknown:error');
        }
    });

    app.start();

    const args = process.argv.slice(2);
    log('Args:', args);

    const builder = new Builder();

    if (args.includes('stdin')) {
        stdin.on('rs', () => {
            Server.restart();
        });
        stdin.on('rb', async () => {
            await builder.build();
        });
    }

    builder.em.on('build', () => {
        log('Rebuilding...');
        Server.restart();
    });

    builder.build();
    // Server.start();

    if (args.includes('watch')) {
        builder.watch('./client');
        builder.watch('./shared');
        builder.watch('./server');
    }

    const close = () => {
        builder.close();
        // kill(child);
        Server.kill();
        deleteDeps()
            .then(() => {
                log('Goodbye! 👋')
                process.exit(0);
            })
            .catch((e) => {
                log('Failed to delete deps', e);
                process.exit(1);
            });
        process.exit(0);
    };

    process.on('SIGINT', close);
    process.on('SIGTERM', close);
    process.on('exit', close);
    process.on('uncaughtException', e => {
        log('Uncaught exception:', e);
        close();
    });
    process.on('unhandledRejection', e => {
        log('Unhandled rejection:', e);
        close();
    });
};

if (require.main === module) {
    main().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
