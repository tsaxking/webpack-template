// Purpose: Unit tests for the server, used in github actions

import { __root } from '../../server/utilities/env';
import { runTask, runFile } from '../../server/utilities/run-task';
import { log, error } from '../../server/utilities/terminal-logging';
import { validate } from '../../server/middleware/data-type';
import { Req } from '../../server/structure/app/req';
import { Res } from '../../server/structure/app/res';
import { deepEqual } from 'assert';
import { check, isValid, parseJSON } from '../../shared/check';
import { match, matchInstance } from '../../shared/match';
import { Client } from 'pg';
import env from '../../server/utilities/env';
import {
    Database,
    PgDatabase,
    Query
} from '../../server/utilities/database/databases';
import { Struct } from '../../server/structure/structs/struct';

/**
 * The name of the main database
 * @date 1/9/2024 - 12:08:08 PM
 *
 * @type {*}
 */
// const {
//     DATABASE_USER,
//     DATABASE_PASSWORD,
//     DATABASE_NAME,
//     DATABASE_HOST,
//     DATABASE_PORT
// } = env;

env.DATABASE_USER = env.DATABASE_USER || 'test';
env.DATABASE_NAME = env.DATABASE_NAME || 'test';
env.DATABASE_HOST = env.DATABASE_HOST || 'localhost';
env.DATABASE_PASSWORD = env.DATABASE_PASSWORD || 'test';
env.DATABASE_PORT = env.DATABASE_PORT || '5432';

const assertEquals = (a: unknown, b: unknown) => {
    try {
        deepEqual(a, b);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
const ok = '✅';
const fail = '❌';

let numTests = 0;
let passing = 0;

const test = async (name: string, fn: () => void | Promise<void>) => {
    numTests++;
    try {
        await fn();
        console.log(ok, name);
        passing++;
        return 0;
    } catch (e) {
        console.log(fail, name);
        console.error(e);
        return 1;
    }
};

const invert = async (name: string, fn: () => void | Promise<void>) => {
    numTests++;
    try {
        await fn();
        console.log(fail, name);
        return 1;
    } catch (e) {
        console.log(ok, name);
        passing++;
        return 0;
    }
};

export const runTests = async (env: Env, database: Database) =>
    Promise.all([
        test('Run async task functionality', async () => {
            const asyncTest = await runFile<string[]>(
                './scripts/tests/run-task-test.ts',
                'asyncFn',
                'a',
                'b',
                'c'
            );
            log('Async test result:', asyncTest);
            if (asyncTest.isErr()) throw asyncTest.error;
            else assertEquals(asyncTest.value, ['a', 'b', 'c']);
        }),

        test('Run sync task functionality', async () => {
            const syncTest = await runFile<string[]>(
                './scripts/tests/run-task-test.ts',
                'syncFn',
                'a',
                'b',
                'c'
            );
            log('Sync test result:', syncTest);
            if (syncTest.isErr()) throw syncTest.error;
            else assertEquals(syncTest.value, ['a', 'b', 'c']);
        }),

        test('Run command', async () => {
            const result = await runTask('echo', ['"test"']);
            log('Command result:', result);
            if (result.isOk()) return assertEquals(true, true);
            throw result.error;
        }),

        test('Data validation', async () => {
            const fail = () => {
                console.log('Validation should not have passed');

                assertEquals(true, false);
            };

            const pass = () => assertEquals(true, true);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invalid: [string, any][] = [];
            const missing: string[] = [];

            // simulate a request
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validate<any>(
                {
                    passBoolean: 'boolean',
                    failBoolean: 'boolean',
                    passString: 'string',
                    failString: 'string',
                    passNumber: 'number',
                    failNumber: 'number',
                    passPrimitiveArray: ['string', 'number'],
                    failPrimitiveArray: ['string', 'number'],
                    passCustomArray: ['a', 'b', 'c'],
                    failCustomArray: ['a', 'b', 'c'],
                    passFunction: () => true,
                    failFunction: () => false,

                    missing: 'string'
                },
                {
                    // log: true,
                    onInvalid: (key, value) => {
                        invalid.push([key, value]);
                    },
                    onMissing: key => {
                        missing.push(key);
                    }
                }
            )(
                {
                    body: {
                        passBoolean: true,
                        failBoolean: 'true',
                        passString: 'test',
                        failString: 1,
                        passNumber: 1,
                        failNumber: '1',
                        passPrimitiveArray: 'string',
                        failPrimitiveArray: true,
                        passCustomArray: 'a',
                        failCustomArray: 'd',
                        passFunction: true,
                        failFunction: false
                    },
                    url: new URL('http://localhost:1234')
                } as unknown as Req,
                {
                    sendStatus: () => {
                        const passedInvalids = invalid.every(
                            ([key, _value]) => {
                                return [
                                    'failBoolean',
                                    'failString',
                                    'failNumber',
                                    'failPrimitiveArray',
                                    'failCustomArray',
                                    'failFunction'
                                ].includes(key);
                            }
                        );

                        const passedMissings = missing.every(
                            key => key === 'missing'
                        );

                        if (passedInvalids && passedMissings) {
                            pass();
                        } else {
                            console.log('Validation failed on the wrong keys');
                            console.log('Passed invalids:', invalid);
                            console.log('Passed missings:', missing);

                            assertEquals(true, false);
                        }
                    }
                } as unknown as Res,
                fail
            );
        }),

        test('Runtime Type Checker', async () => {
            const run = (data: unknown, type: isValid, expect: boolean) => {
                const result = check(data, type);
                if (result !== expect) {
                    console.log('Failed:', data, type, expect);
                }
                return result;
            };

            const passes = [
                run({ a: 1 }, { a: 'number' }, true),
                run({ a: '1' }, { a: 'string' }, true),
                run({ a: [1, 2, 3] }, { a: ['number'] }, true),
                run({ a: ['1', '2', '3'] }, { a: ['string'] }, true),
                run({ a: { b: 1 } }, { a: { b: 'number' } }, true),
                run({ a: { b: '1' } }, { a: { b: 'string' } }, true),
                run({ a: { b: [1, 2, 3] } }, { a: { b: ['number'] } }, true),
                run(
                    { a: { b: ['1', '2', '3'] } },
                    { a: { b: ['string'] } },
                    true
                ),
                run({ a: '1' }, { a: ['string', 'number'] }, true),
                run({ a: 1 }, { a: ['string', 'number'] }, true),

                run({ a: true, b: false }, { a: 'boolean', b: 'boolean' }, true)
            ];
            const fails = [
                run({ a: 1 }, { a: 'string' }, false),
                run({ a: '1' }, { a: 'number' }, false),
                run({ a: [1, 2, 3] }, { a: ['string'] }, false),
                run({ a: ['1', '2', '3'] }, { a: ['number'] }, false),
                run({ a: { b: 1 } }, { a: { b: 'string' } }, false),
                run({ a: { b: '1' } }, { a: { b: 'number' } }, false),
                run({ a: { b: [1, 2, 3] } }, { a: { b: ['string'] } }, false),
                run(
                    { a: { b: ['1', '2', '3'] } },
                    { a: { b: ['number'] } },
                    false
                ),
                run({ a: '1' }, { a: ['number'] }, false),
                run({ a: 1 }, { a: ['string'] }, false),

                run({ a: true, b: false }, { a: 'boolean', b: 'string' }, false)
            ];

            if (passes.every(v => v) && fails.every(v => !v)) {
                return assertEquals(true, true);
            }

            throw new Error('Failed');
        }),

        test('JSON parsing', async () => {
            const obj = {
                a: 1,
                b: '2',
                c: [1, 2, 3],
                d: { e: 'f' }
            };

            const str = JSON.stringify(obj);

            const parsed = parseJSON(str, {
                a: 'number',
                b: 'string',
                c: ['number'],
                d: { e: 'string' }
            });

            const failed = parseJSON(str, {
                a: 'string',
                b: 'number',
                c: ['string'],
                d: { e: 'number' }
            });

            if (parsed.isOk() && failed.isErr()) {
                return assertEquals(true, true);
            }

            throw new Error('Failed');
        }),

        test('Match Case', async () => {
            const value = 'test';

            const a = match(value)
                .case('test', () => {
                    return 'test';
                })
                .case('test2', () => {
                    return 'test2';
                })
                .default(() => {
                    return 'default';
                })
                .exec()
                .unwrap();

            const b = match(value)
                .case('test2', () => {
                    return 'test2';
                })
                .default(() => {
                    return 'default';
                })
                .exec()
                .unwrap();

            class Test {}

            const c = matchInstance(new Test())
                .case(Test, () => 'test')
                .case(Array, () => 'array')
                .default(() => 'default')
                .exec()
                .unwrap();

            assertEquals(a, 'test');
            assertEquals(b, 'default');
            assertEquals(c, 'test');
        }),

        test('Database Functionality', async () => {
            const qA = Query.build(`
                CREATE TABLE IF NOT EXISTS TestTable (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL
                );
            `);

            (await database.unsafe.run(qA)).unwrap();

            const qB = Query.build(
                `
                INSERT INTO TestTable (id, name)
                VALUES (:id, :name);
            `,
                {
                    id: 1,
                    name: 'test'
                }
            );

            (await database.unsafe.run(qB)).unwrap();

            const qC = Query.build(`
                SELECT * FROM TestTable;
            `);

            const result = (
                await database.unsafe.get<{ id: number; name: string }>(qC)
            ).unwrap();

            assertEquals(result, { id: 1, name: 'test' });

            const qD = Query.build(`
                DROP TABLE TestTable;
            `);
            (await database.unsafe.run(qD)).unwrap();
        }),

        // test('Database Backups', async () => {
        //     const qA = Query.build(`
        //         CREATE TABLE IF NOT EXISTS TestTable2 (
        //             id INTEGER PRIMARY KEY,
        //             name TEXT NOT NULL
        //         );
        //     `);

        //     (await database.unsafe.run(qA)).unwrap();

        //     const qB = Query.build(
        //         `
        //         INSERT INTO TestTable2 (id, name)
        //         VALUES (:id, :name);
        //     `,
        //         {
        //             id: 1,
        //             name: 'test'
        //         }
        //     );

        //     (await database.unsafe.run(qB)).unwrap();

        //     const backup = (await Backup.makeBackup(database)).unwrap();

        //     (await backup.restore(database)).unwrap();

        //     const qD = Query.build(`
        //         SELECT * FROM TestTable2;
        //     `);

        //     const result = (
        //         await database.unsafe.get<{ id: number; name: string }>(qD)
        //     ).unwrap();

        //     assertEquals(result, { id: 1, name: 'test' });

        //     (await backup.delete()).unwrap();
        // }),

        test('Structs', async () => {
            const Item = new Struct({
                name: 'Item',
                structure: {
                    name: 'text',
                    price: 'integer'
                },
                database
            });

            (await Item.build()).unwrap();

            await test('Struct Generator', async () => {
                const i = (
                    await Item.new({
                        name: 'test',
                        price: 100
                    })
                ).unwrap();

                assertEquals(i.data.name, 'test');

                (
                    await i.update({
                        price: 200
                    })
                ).unwrap();

                assertEquals(i.data.price, 200);

                const item2 = (await Item.fromId(i.id)).unwrap();
                assertEquals(item2?.data.price, 200);

                const [item3] = (
                    await Item.fromProperty('name', i.data.name, false)
                ).unwrap();
                assertEquals(item3?.data.price, 200);

                const stream = Item.all(true);

                stream.on('data', item2 => {
                    assertEquals(item2.data.price, 200);
                });

                (await i.delete()).unwrap();
            });

            await test('Build Setup', async () => {
                const s = new Struct({
                    name: 'StructBuildSetup',
                    structure: {
                        name: 'text',
                        price: 'integer'
                    },
                    database
                });

                await invert('Use before build', async () => {
                    (
                        await s.new({
                            name: 'test',
                            price: 100
                        })
                    ).unwrap();
                });

                await invert('Build twice', async () => {
                    (await s.build()).unwrap();
                    (await s.build()).unwrap();
                });

                await invert('Migration', async () => {
                    await s.createMigration(
                        {
                            dbVersion: [1, 0, 0],
                            schema: {}
                        },
                        {
                            dbVersion: [1, 0, 1],
                            schema: {
                                name: 'text',
                                price: 'integer'
                            }
                        },
                        d => ({
                            ...d,
                            name: 'test',
                            price: 0
                        })
                    );
                });
            });
        })
    ]);

type Env = {
    [key: string]: string | undefined;
};

// const readEnv = (envPath: string): Env => {
//     const env = fs
//         .readFileSync(envPath, 'utf8')
//         .replace(/#.*/g, '')
//         .replace(/\n\n/g, '\n')
//         .trim();

//     return env.split('\n').reduce((acc, line) => {
//         const [key, value] = line
//             .split('=')
//             .map(k => k.trim().replace(/['"]/g, ''));
//         if (key && value) {
//             acc[key] = value;
//         }
//         return acc;
//     }, {} as Env);
// };

// const saveEnv = (envPath: string, env: Env) => {
//     const envStr = Object.keys(env)
//         .map(key => `${key} = '${env[key]}'`)
//         .join('\n');
//     fs.writeFileSync(envPath, envStr);
// };

const buildDatabase = () => {
    // attemptAsync(() => {
    // return new Promise<void>((res, rej) => {
    //     setTimeout(
    //         () => {
    //             rej('Database took too long to build');
    //         },
    //         1000 * 60 * 5
    //     );

    return runTask(
        'bash',
        [
            './scripts/db-init.sh',
            '--force-reset',
            '--user=' + (env.DATABASE_USER || 'test'),
            '--password=' + (env.DATABASE_PASSWORD || 'test'),
            '--database=' + (env.DATABASE_NAME || 'test')
        ],
        60 * 1000
    );

    // const pcs = spawn(
    //     'sh',
    //     [
    //         './db-init.sh',
    //         '--force-reset',
    //         '--user=' + env.DATABASE_USER || 'test',
    //         '--password=' + env.DATABASE_PASSWORD || 'test',
    //         '--database=' + env.DATABASE_NAME || 'test'
    //     ],
    //     {
    //         stdio: 'inherit',
    //         cwd: path.resolve(__dirname, '../')
    //     }
    // );

    // pcs.on('exit', code => {
    //     if (code === 0) {
    //         res();
    //     } else {
    //         rej(code);
    //     }
    // });
    // });
    // });
};
const main = async () => {
    // process.on('exit', () => {
    //     log('Resetting env');
    //     try {
    //         fs.cpSync(
    //             path.resolve(__dirname, '../../._env'),
    //             path.resolve(__dirname, '../../.env')
    //         );
    //         fs.unlinkSync(path.resolve(__dirname, '../../._env'));
    //     } catch (error) {
    //         console.warn(error);
    //     }
    // });

    // log('Reading env');
    // let env: Record<string, string> = {};
    // try {
    //     env = readEnv(path.resolve(__dirname, '../../.env'));
    //     fs.cpSync(
    //         path.resolve(__dirname, '../../.env'),
    //         path.resolve(__dirname, '../../._env')
    //     );
    // } catch (error) {
    //     console.warn(error);
    // }

    // env.PORT = '3000';
    // env.ENVIRONMENT = 'test';
    // env.DOMAIN = 'http://localhost:3000';
    // env.TITLE = 'Test Server';
    // env.DATABASE_NAME = env.DATABASE_NAME + '_test';
    // env.DATABASE_PORT = '5432';
    // env.DATABASE_HOST = 'localhost';
    // if (!env.DATABASE_PASSWORD) env.DATABASE_PASSWORD = 'test';

    // saveEnv(path.resolve(__dirname, '../../.env'), env);

    log('Building database...');
    const dbRes = await buildDatabase();
    if (dbRes.isErr()) {
        error(dbRes.error);
        process.exit(1);
    }
    log('Database built successfully');

    const client = new Client({
        user: env.DATABASE_USER,
        database: env.DATABASE_NAME,
        host: env.DATABASE_HOST,
        password: env.DATABASE_PASSWORD,
        port: Number(env.DATABASE_PORT),
        keepAlive: true
    });
    const pgDb = new PgDatabase(client);
    const database = new Database(pgDb);
    (await database.connect()).unwrap();
    (await database.reset(true)).unwrap();
    (await database.init()).unwrap();

    runTests(env, database).then(val => {
        console.log(
            `Tests completed with ${passing}/${numTests} passing (${(passing / numTests) * 100}%)`
        );
        process.exit(val.some(v => v === 1) ? 1 : 0);
    });
};

if (require.main === module) main();
