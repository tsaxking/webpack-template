import path from 'node:path';
import { error, log } from "./terminal-logging.ts";
import { dirname, __root } from "./env.ts";

/**
 * 
 * @param {string} file File path
 * @param {string[]} args Arguments to pass to the file
 * @returns 
 */
export const runTask = async (file: string, ...args: string[]): Promise<number> => {
    log(__root);
    return new Promise<number>((resolve, reject) => {
        import(__root + file).then((module) => {
            log('Running task:', dirname(), file);
            resolve(0);
        }).catch((err) => {
            error('Error running task:', dirname(), err);
            resolve(1);
        });
    });
};