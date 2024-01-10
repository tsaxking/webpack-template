import { assertEquals } from 'https://deno.land/std@0.205.0/assert/mod.ts';
import { __root } from '../../server/utilities/env.ts';
import '../init.ts';
import { runCommand, runTask } from '../../server/utilities/run-task.ts';
import { log } from '../../server/utilities/terminal-logging.ts';

export const runTests = async () => {
    Deno.test('Database Speed and Reliability', async () => {
        const num = 1000;
        const result = await runTask<number>(
            '/scripts/tests/db-speed.ts',
            'test',
            num.toString(),
        );
        log('Result:', result);
        if (result.error) throw result.error;
        else assertEquals(result.result, num);
    });

    Deno.test('Run async task functionality', async () => {
        const asyncTest = await runTask<string[]>(
            '/scripts/tests/run-task-test.ts',
            'asyncFn',
            'a',
            'b',
            'c',
        );
        log('Async test result:', asyncTest);
        if (asyncTest.error) throw asyncTest.error;
        else assertEquals(asyncTest.result, ['a', 'b', 'c']);
    });

    Deno.test('Run sync task functionality', async () => {
        const syncTest = await runTask<string[]>(
            '/scripts/tests/run-task-test.ts',
            'syncFn',
            'a',
            'b',
            'c',
        );
        log('Sync test result:', syncTest);
        if (syncTest.error) throw syncTest.error;
        else assertEquals(syncTest.result, ['a', 'b', 'c']);
    });

    Deno.test('Run command', async () => {
        const result = await runCommand('echo "test"');
        log('Command result:', result);
        assertEquals(result.error, null);
    });
};
