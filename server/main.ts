import { Builder } from './bundler';
import { Colors } from './utilities/colors';
import { deleteDeps, pullDeps } from '../scripts/pull-deps';
// import { Worker } from "worker_threads";
// import env from "./utilities/env";
import { ChildProcess, spawn } from 'child_process';
import { stdin } from './utilities/stdin';
import path from 'path';

// TODO: Multithreading
// class Server {
//     static readonly workers = new Map<number, Server>();

//     static start() {
//         const workers = Server.workers.values();
//         for (const worker of workers) {
//             worker.start();
//         }
//     }
//     static kill() {
//         const workers = Server.workers.values();
//         for (const worker of workers) {
//             worker.kill();
//         }
//     }
//     static restart() {
//         Server.kill();
//         Server.start();
//     }

//     private worker: Worker;

//     constructor(public readonly id: number) {
//         Server.workers.set(id, this);
//     }

//     start() {
//         this.worker = new Worker('./server.ts', {
//             workerData: {
//                 port: this.id
//             }
//         });
//     }
//     kill() {
//         this.worker.terminate();
//     }
// }

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
    // const res = await pullDeps();
    // if (res.isErr()) throw res.error;

    // const servers = Number(env.NUM_SERVERS) || 1;

    // for (let i = 0; i < servers; i++) new Server(i);

    const args = process.argv.slice(2);
    log('Args:', args);

    // temporary
    const start = (): ChildProcess => {
        log('Starting server...');
        const child = spawn('ts-node', [
            path.resolve(__dirname, './server.ts')
        ]);

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
        child.stdin.pipe(process.stdin);

        return child;
    };
    const kill = (child: ChildProcess | undefined) => {
        if (!child) return;
        child.kill();
    };
    const restart = (child: ChildProcess | undefined): ChildProcess => {
        if (!child) return start();
        kill(child);
        return start();
    };

    const builder = new Builder();
    let child: ChildProcess | undefined = undefined;

    if (args.includes('stdin')) {
        stdin.on('rs', () => {
            child = restart(child);
        });
        stdin.on('rb', async () => {
            await builder.build();
        });
    }

    builder.em.on('build', () => {
        log('Rebuilding...');
        child = restart(child);
    });

    builder.build();

    // child = start();

    if (args.includes('watch')) {
        builder.watch('./client');
        builder.watch('./shared');
        builder.watch('./server');
    }

    const close = () => {
        builder.close();
        kill(child);
        // Server.kill();
        // deleteDeps()
        //     .then(() => {
        //         log('Goodbye! 👋')
        //         process.exit(0);
        //     })
        //     .catch((e) => {
        //         log('Failed to delete deps', e);
        //         process.exit(1);
        //     });
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
