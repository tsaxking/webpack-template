import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { Colors } from '../../server/utilities/colors';
import { bundle } from '../esbuild';
import axios from 'axios';
import { EventEmitter } from '../../shared/event-emitter';

type Env = {
    [key: string]: string;
};

const log = (...data: unknown[]) =>
    console.log(Colors.FgBlue, '[Test]', Colors.Reset, ...data);

const err = (...data: unknown[]) =>
    console.error(Colors.FgRed, '[Test]', Colors.Reset, ...data);

const readEnv = (envPath: string): Env => {
    const env = fs
        .readFileSync(envPath, 'utf8')
        .replace(/#.*/g, '')
        .replace(/\n\n/g, '\n')
        .trim();

    return env.split('\n').reduce((acc, line) => {
        const [key, value] = line
            .split('=')
            .map(k => k.trim().replace(/['"]/g, ''));
        if (key && value) {
            acc[key] = value;
        }
        return acc;
    }, {} as Env);
};

const saveEnv = (envPath: string, env: Env) => {
    const envStr = Object.keys(env)
        .map(key => `${key} = '${env[key]}'`)
        .join('\n');
    fs.writeFileSync(envPath, envStr);
};

const buildDatabase = () => {
    return new Promise<void>((res, rej) => {
        setTimeout(() => {
            rej('Database took too long to build');
        }, 10000);

        const pcs = spawn('sh', ['./db-init.sh'], {
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '..')
        });

        pcs.on('exit', code => {
            if (code === 0) {
                res();
            } else {
                rej(code);
            }
        });
    });
};

const resetDB = (env: Env) => {
    const emitter = new EventEmitter<'error' | 'stop' | 'done'>();

    const pcs = spawn('ts-node', ['./scripts/reset-db.ts'], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
        env
    });

    pcs.on('exit', () => emitter.emit('done'));
    pcs.on('error', e => emitter.emit('error', e));
    emitter.on('stop', () => pcs.kill());

    return emitter;
};

class Server {
    public status: 'on' | 'off' = 'off';
    public process: ChildProcess | null = null;

    start() {
        return new Promise<void>((res, rej) => {
            if (this.status === 'on') return rej('Server is already running');
            setTimeout(() => {
                rej('Server took too long to start');
            }, 10000);

            const log = (...data: unknown[]) =>
                console.log(Colors.FgYellow, '[Server]', Colors.Reset, ...data);

            const err = (...data: unknown[]) =>
                console.error(Colors.FgRed, '[Server]', Colors.Reset, ...data);

            this.process = spawn('ts-node', ['server/server.ts'], {
                stdio: 'pipe'
            });

            log('Server started');

            this.process.on('exit', () => {
                this.status = 'off';
                log('Server stopped');
                this.process = null;
            });

            this.process.on('error', e => {
                err(e);
            });

            // when the server logs "Server is running on port 3000"
            this.process.stdout?.on('data', data => {
                log(data.toString().trim());
                if (
                    data.toString().includes('Server is listening on port 3000')
                ) {
                    this.status = 'on';
                    res();
                }
            });
        });
    }

    stop() {
        if (this.status === 'off') return;
        this.process?.kill();
    }
}

type Test = {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body: unknown;
    expect?: (response: unknown) => boolean | Promise<boolean>;
};

const tests: Test[] = [];

export const runTest = (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: unknown
) => {
    tests.push({ url, method, body });
};

import './server-tests';

const main = async () => {
    const server = new Server();
    // reset env
    process.on('exit', () => {
        log('Resetting env');
        fs.cpSync(
            path.resolve(__dirname, '../../._env'),
            path.resolve(__dirname, '../../.env')
        );
        fs.unlinkSync(path.resolve(__dirname, '../../._env'));
        server.stop();
        em.emit('stop');
    });

    log('Reading env');
    const env = readEnv(path.resolve(__dirname, '../../.env'));
    fs.cpSync(
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../../._env')
    );

    env.PORT = '3000';
    env.SOCKET_PORT = '3001';
    env.ENVIRONMENT = 'test';
    env.DOMAIN = 'http://localhost:3000';
    env.SOCKET_DOMAIN = 'ws://localhost:3001';
    env.TITLE = 'Test Server';
    env.DATABASE_NAME = env.DATABASE_NAME + '_test';
    env.DATABASE_PORT = '5432';
    env.DATABASE_HOST = 'localhost';

    saveEnv(path.resolve(__dirname, '../../.env'), env);

    await buildDatabase();

    const em = resetDB(env);
    em.on('error', () => {
        process.exit(1);
    });

    log('Building client');
    await bundle(false);

    log('Starting server');
    await server.start();

    // run tests
    for (let i = 0; i < tests.length; i++) {
        const { url, method, body, expect } = tests[i];
        const str = `${Colors.BgGreen}Test ${i + 1}: ${method} ${url}${Colors.Reset}`;

        try {
            const res = await axios({
                method,
                url: env.DOMAIN + url,
                data: body
            });

            if (expect) {
                if (!(await expect(res.data))) {
                    throw new Error('Test failed, expected value not returned');
                }
            }

            log(str, res.status, res.statusText);
        } catch (e) {
            err(str, e);
        }
    }

    process.exit(0);
};

if (require.main === module) {
    main().catch(err);
}
