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

const buildDatabase = () =>
    attemptAsync(() => {
        return new Promise<void>((res, rej) => {
            setTimeout(
                () => {
                    rej('Database took too long to build');
                },
                1000 * 60 * 5
            );

            const pcs = spawn('sh', ['./db-init.sh', '--force-reset'], {
                stdio: 'inherit',
                cwd: path.resolve(__dirname, '../')
            });

            pcs.on('exit', code => {
                if (code === 0) {
                    res();
                } else {
                    rej(code);
                }
            });
        });
    });

class Server {
    public status: 'on' | 'off' = 'off';
    public process: ChildProcess | null = null;

    start() {
        return new Promise<void>((res, rej) => {
            if (this.status === 'on') return rej('Server is already running');
            setTimeout(
                () => {
                    rej('Server took too long to start');
                },
                1000 * 60 * 5
            );

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
    method: Method;
    body: unknown;
    expect?: (response: unknown) => boolean | Promise<boolean>;
};

const tests: Test[] = [];

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const runTest = <T extends Method>(
    url: string,
    method: Method,
    body?: unknown
) => {
    tests.push({ url, method, body });
};

import './server-tests';
import { attemptAsync } from '../../shared/check';

const request = async (url: string, method: Method, body: unknown) => {
    return attemptAsync(async () => {
        const res = await axios<unknown>({
            method,
            url,
            data: body
        });

        return res;
    });
};

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

    log('Building database...');
    const dbRes = await buildDatabase();
    if (dbRes.isErr()) {
        err(dbRes.error);
        process.exit(1);
    }
    log('Database built successfully');

    log('Building client');
    const res = await bundle();
    if (res.isErr()) {
        err(res.error);
        process.exit(1);
    }

    log('Client built successfully');

    log('Starting server');
    await server.start();

    await Promise.all(
        tests.map(async (t, i) => {
            const { url, method, body, expect } = t;
            const okStr = `${Colors.BgGreen}Test ${i + 1}: ${method} ${url}${Colors.Reset}`;
            const errStr = `${Colors.BgRed}Test ${i + 1}: ${method} ${url}${Colors.Reset}`;

            try {
                const res = await (
                    await request(env.DOMAIN + url, method, body)
                ).unwrap();

                if (expect) {
                    if (!(await expect(res.data))) {
                        throw new Error(
                            'Test failed, expected value not returned'
                        );
                    }
                }

                log(okStr, res.status, res.statusText);
            } catch (e) {
                err(errStr, e);
            }
        })
    );

    process.exit(0);
};

if (require.main === module) {
    main().catch(err);
}
