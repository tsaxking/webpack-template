import { attemptAsync } from "../../shared/check"
import { spawn } from "child_process"
import * as tsNode from 'ts-node';

export const runTask = async (command: string, args: string[]) => {
    return attemptAsync(() => {
        return new Promise<void>((res, rej) => {
            const task = spawn(command, args);
            task.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            task.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            task.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                rej();
            });

            setTimeout(() => {
                rej();
                task.kill();
            }, 1000 * 5);
        });
    });
}

export const runFile = async <T>(file: string, fn: string, ...params: string[]) => {
    return attemptAsync(async () => {
        tsNode.register({ transpileOnly: true });
        const mod = await import(file);
        const func = mod[fn];
        if (typeof func !== 'function') throw new Error('Function not found');
        return await func(...params) as T;
    });
}
