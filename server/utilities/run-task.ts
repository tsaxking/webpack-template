import { error, log } from './terminal-logging.ts';
import { __dirname, __root, addFileProtocol, resolve } from './env.ts';
import { spawn } from 'node:child_process';
import { attemptAsync, Result } from '../../shared/check.ts';

/**
 * Runs a deno file
 * @param {string} file File path from the root of the project (must start with a slash)
 * @param {string} functionName Function to run from the file
 * @param {string[]} args Arguments to pass to the function
 * @returns
 */
export const runTask = async <T>(
    file: string,
    functionName?: string,
    ...args: string[]
): Promise<Result<T>> => {
    return attemptAsync(async () => {
        return new Promise<T>((res, rej) => {
            import(addFileProtocol(resolve(__root, file)))
                .then(async (module) => {
                    if (functionName) {
                        if (typeof module[functionName] === 'function') {
                            log(
                                'Running task:',
                                __dirname(),
                                file,
                                functionName,
                            );
                            try {
                                const result = await module[functionName](
                                    ...args,
                                ); // run the function, if it's async it will wait, otherwise it will just run
                                return res(result as T);
                            } catch (e) {
                                error(
                                    'Error running task:',
                                    __dirname(),
                                    'function',
                                    functionName,
                                    e,
                                );
                                return rej(e);
                            }
                        } else {
                            error(
                                'Error running task:',
                                __dirname(),
                                'function',
                                functionName,
                                'not found',
                            );
                            return rej('Function not found');
                        }
                    }

                    log('Running task:', __dirname(), file);
                    res(null as T);
                })
                .catch((err) => {
                    error('Error running task:', __dirname(), err);
                    rej(err);
                });
        });
    });
};

/**
 * Runs a command (unstable!)
 * @date 1/9/2024 - 12:33:21 PM
 *
 * @async
 */
export const runCommand = async (
    command: string,
    ...args: string[]
): Promise<Result<void>> => {
    return attemptAsync(async () => {
        return new Promise<void>((res, rej) => {
            try {
                // using spawn from node
                const process = spawn(command, args, {
                    stdio: 'pipe',
                    shell: true,
                });

                process.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                process.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                });

                process.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);

                    if (code) {
                        rej('Process exited with code ' + code);
                    } else {
                        res();
                    }
                });
            } catch (e) {
                rej(e);
            }
        });
    });
};

// export const run = async (cmd: string) => {
//     const process = new Deno.Command()
// }
