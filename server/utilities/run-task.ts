import { error, log } from "./terminal-logging.ts";
import { __dirname, __root, resolve } from "./env.ts";
import { spawn } from 'node:child_process';


type Result<T> = {
    error: Error,
    code: number
} | {
    error: null,
    code: 0,
    result: T
}

/**
 * 
 * @param {string} file File path from the root of the project (must start with a slash)
 * @param {string} functionName Function to run from the file
 * @param {string[]} args Arguments to pass to the function
 * @returns 
 */
export const runTask = async <T>(file: string, functionName?: string, ...args: string[]): Promise<Result<T>> => {
    return new Promise<Result<T>>((res) => {
        import(
            resolve(__root, file)
        ).then(async (module) => {
            if (functionName) {
                if (typeof module[functionName] === 'function') {
                    log('Running task:', __dirname(), file, functionName);
                    try {
                        const result = await module[functionName](...args); // run the function, if it's async it will wait, otherwise it will just run
                        return res({
                            error: null,
                            code: 0,
                            result: result as T
                        });
                    } catch (e) {
                        error('Error running task:', __dirname(), 'function', functionName, e);
                        return res({
                            error: e,
                            code: 1
                        });
                    }
                } else {
                    error('Error running task:', __dirname(), 'function', functionName, 'not found');
                    return res({
                        error: new Error('Function not found'),
                        code: 1
                    });
                }
            }

            log('Running task:', __dirname(), file);
            res({
                error: null,
                code: 0,
                result: null as T
            });
        }).catch((err) => {
            error('Error running task:', __dirname(), err);
            res({
                error: err,
                code: 1
            });
        });
    });
};


export const runCommand = async (command: string, ...args: string[]): Promise<Result<string>> => {
    return new Promise<Result<string>>((resolve) => {
        try {
            // using spawn from node
            const process = spawn(command, args, {
                stdio: 'pipe',
                shell: true
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
                    resolve({
                        error: new Error('Process exited with code ' + code),
                        code: code
                    });
                } else {
                    resolve({
                        error: null,
                        code: 0,
                        result: ''
                    });
                }
            });
        } catch (e) {
            resolve({
                error: e,
                code: 1
            });
        }
    });
};