// Purpose: Unit tests for the server, used in github actions

import { __root } from '../../server/utilities/env';
import { runTask, runFile } from '../../server/utilities/run-task';
import { log } from '../../server/utilities/terminal-logging';
import { validate } from '../../server/middleware/data-type';
import { Req } from '../../server/structure/app/req';
import { Res } from '../../server/structure/app/res';
import test from 'test';
import assert from 'assert';

const assertEquals = (a: unknown, b: unknown) => {
    assert.deepEqual(a, b);
};

export const runTests = async () => {
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
    });

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
    });

    test('Run command', async () => {
        const result = await runTask('echo', ['"test"']);
        log('Command result:', result);
        if (result.isOk()) return assertEquals(true, true);
        throw result.error;
    });

    test('Data validation', async () => {
        const fail = () => {
            console.log('Validation should not have passed');

            assertEquals(true, false);
        };

        const pass = () => assertEquals(true, true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invalid: [string, any][] = [];
        const missing: string[] = [];

        JSON.parse;

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
                    const passedInvalids = invalid.every(([key, _value]) => {
                        return [
                            'failBoolean',
                            'failString',
                            'failNumber',
                            'failPrimitiveArray',
                            'failCustomArray',
                            'failFunction'
                        ].includes(key);
                    });

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
    });

    // if (!process.argv.includes('lite')) {
    //     test('Database tests', async () => {
    //         const { DB } = await import('../../server/utilities/databases');
    //     });
    // }
};

if (require.main) runTests();
