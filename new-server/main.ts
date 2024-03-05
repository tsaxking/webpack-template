import { Builder } from "./bundler";
import { Colors } from "./utilities/colors";
import { deleteDeps, pullDeps } from "../scripts/pull-deps";
import { Worker } from "worker_threads";
import env from "./utilities/env";
import { ChildProcess, spawn } from "child_process";
import { stdin } from "./utilities/stdin";

// TODO: Multithreading
class Server {
    static readonly workers = new Map<number, Server>();

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


    private worker: Worker;

    constructor(public readonly id: number) {
        Server.workers.set(id, this);
    }

    start() {
        this.worker = new Worker('./server.ts', {
            workerData: {
                port: this.id
            }
        });
    }
    kill() {
        this.worker.terminate();
    }
}

const log = (...args: unknown[]) => 
    console.log(Colors.FgBlue, '[Main]', Colors.Reset, new Date().toISOString(), ...args);

const main = async () => {
    const args = process.argv.slice(2);

    const res = await pullDeps();
    if (res.isErr()) throw res.error;

    // const servers = Number(env.NUM_SERVERS) || 1;

    // for (let i = 0; i < servers; i++) new Server(i);


    // temporary
    const start = (): ChildProcess => {
        log('Starting server...');
        const child = spawn('node', []);

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
        child.stdin.pipe(process.stdin);

        return child;
    };
    const kill = (child: ChildProcess) => {
        child.kill();
    };
    const restart = (child: ChildProcess): ChildProcess => {
        kill(child);
        return start();
    }

    const builder = new Builder();
    let child = start();

    if (args.includes('--stdin')) {
        stdin.on('rs', () => {
            child = restart(child);
        });
        stdin.on('rb', async () => {
            await builder.build();
            child = restart(child);
        });
    }

    if (args.includes('--watch')) {
        builder.watch('./client');
        builder.watch('./shared');
    }

    const close = () => {
        builder.close();
        kill(child);
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
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}