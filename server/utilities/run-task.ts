import { error, log } from "./terminal-logging.ts";
import { dirname, __root } from "./env.ts";


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
    return new Promise<Result<T>>((resolve) => {
        import(__root + file).then(async (module) => {
            if (functionName) {
                if (typeof module[functionName] === 'function') {
                    log('Running task:', dirname(), file, functionName);
                    try {
                        const result = await module[functionName](...args); // run the function, if it's async it will wait, otherwise it will just run
                        return resolve({
                            error: null,
                            code: 0,
                            result: result as T
                        });
                    } catch (e) {
                        error('Error running task:', dirname(), 'function', functionName, e);
                        return resolve({
                            error: e,
                            code: 1
                        });
                    }
                } else {
                    error('Error running task:', dirname(), 'function', functionName, 'not found');
                    return resolve({
                        error: new Error('Function not found'),
                        code: 1
                    });
                }
            }

            log('Running task:', dirname(), file);
            resolve({
                error: null,
                code: 0,
                result: null as T
            });
        }).catch((err) => {
            error('Error running task:', dirname(), err);
            resolve({
                error: err,
                code: 1
            });
        });
    });
};