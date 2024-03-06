import render from 'node-html-constructor/versions/v4';
import ObjectsToCsv from 'objects-to-csv';
import { __logs, __root, __templates, __uploads } from './env';
import { attempt, attemptAsync, Result } from '../../shared/check';
import { match, matchInstance } from '../../shared/match';
import { error } from './terminal-logging';
import fs from 'fs';
import path from 'path';
import callsite from 'callsite';

export type JSONError = 'InvalidJSON' | 'Unknown';
export type FileError = 'NoFile' | 'FileExists' | 'NoAccess' | 'Unknown';

const matchJSONError = (e: Error): JSONError =>
    matchInstance<Error, JSONError>(
        e,
        [SyntaxError, () => 'InvalidJSON'],
        [Error, () => 'Unknown']
    ) ?? 'Unknown';

const matchFileError = (e: Error): FileError =>
    matchInstance<Error, FileError>(
        e,
        [Error, () => 'Unknown'],
        [TypeError, () => 'NoFile'],
        [Error, () => 'FileExists'],
        [Error, () => 'NoAccess']
    ) ?? 'Unknown';

const makeFolder = (folder: string) => {
    try {
        fs.mkdirSync(folder, { recursive: true });
    } catch {
        error('Dir exists');
    }
};

const filePathBuilder = (file: string, ext: string, dir: string) => {
    let output: string;
    // console.log(file, ext, dir);
    if (!file.endsWith(ext)) {
        file += ext;
    }

    if (file.startsWith('.')) {
        const stack = callsite(),
            caller = stack[2].getFileName(),
            requesterDir = path.dirname(caller);
        output = path.resolve(__root, requesterDir, file);
    } else {
        output = path.resolve(__root, dir, file);
    }
    // console.log({ output });

    return output;
};

const removeComments = (content: string) => {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // multi line comments (js & css)
        .replace(/\/\/ .*/g, '') // single line comments (js)
        .replace(/<!--[\s\S]*?-->/g, ''); // html comments (html)
};

export const getJSONSync = <T = unknown>(
    file: string
): Result<T, JSONError> => {
    return attempt(() => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(removeComments(data)) as T;
    }, matchJSONError);
};

export const getJSON = <T = unknown>(
    file: string
): Promise<Result<T, JSONError>> => {
    return attemptAsync(async () => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(removeComments(data)) as T;
    }, matchJSONError);
};

export const saveJSONSync = <T = unknown>(
    file: string,
    data: T
): Result<void, JSONError> => {
    return attempt(() => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        makeFolder(path.dirname(filePath));
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }, matchJSONError);
};

export const saveJSON = <T = unknown>(
    file: string,
    data: T
): Promise<Result<void, JSONError>> => {
    return attemptAsync(async () => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        makeFolder(path.dirname(filePath));
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    }, matchJSONError);
};

export const removeJSONSync = (file: string): Result<void, JSONError> => {
    return attempt(() => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        fs.rmSync(filePath);
    }, matchJSONError);
};

export const removeJSON = (file: string): Promise<Result<void, JSONError>> => {
    return attemptAsync(async () => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        await fs.promises.rm(filePath);
    }, matchJSONError);
};

export type Constructor = {
    [key: string]:
        | string
        | number
        | boolean
        | undefined
        | Constructor[]
        | Constructor;
};

export const getTemplateSync = (
    file: string,
    options?: Constructor
): Result<string, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates');
        const data = fs.readFileSync(p, 'utf-8');

        return removeComments(options ? render(data, options) : data);
    }, matchFileError);
};

export const getTemplate = (
    file: string,
    options?: Constructor
): Promise<Result<string, FileError>> => {
    return attemptAsync(async () => {
        const p = filePathBuilder(file, '.html', './public/templates');
        const data = await fs.promises.readFile(p, 'utf-8');

        return removeComments(options ? render(data, options) : data);
    }, matchFileError);
};

export const saveTemplateSync = (
    file: string,
    data: string
): Result<void, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates');
        makeFolder(path.dirname(p));
        fs.writeFileSync(p, data);
    }, matchFileError);
};

export const saveTemplate = (
    file: string,
    data: string
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = filePathBuilder(file, '.html', './public/templates');
        makeFolder(path.dirname(p));
        await fs.promises.writeFile(p, data);
    }, matchFileError);
};

export const removeTemplateSync = (file: string): Result<void, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates');
        fs.rmSync(p);
    }, matchFileError);
};

export const removeTemplate = (
    file: string
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = filePathBuilder(file, '.html', './public/templates');
        await fs.promises.rm(p);
    }, matchFileError);
};

export const createUploadsFolder = () => makeFolder(__uploads);
export const createLogsFolder = () => makeFolder(__logs);

export const saveUpload = (
    filename: string,
    data: Uint8Array
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__uploads, filename);
        makeFolder(path.dirname(p));
        await fs.promises.writeFile(p, data);
    }, matchFileError);
};

export const saveUploadSync = (
    filename: string,
    data: Uint8Array
): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__uploads, filename);
        makeFolder(path.dirname(p));
        fs.writeFileSync(p, data);
    }, matchFileError);
};

export const removeUpload = (
    filename: string
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__uploads, filename);
        await fs.promises.rm(p);
    }, matchFileError);
};

export const removeUploadSync = (filename: string): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__uploads, filename);
        fs.rmSync(p);
    }, matchFileError);
};

export const getUpload = (
    filename: string
): Promise<Result<Uint8Array, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__uploads, filename);
        return await fs.promises.readFile(p);
    }, matchFileError);
};

export const getUploadSync = (
    filename: string
): Result<Uint8Array, FileError> => {
    return attempt(() => {
        const p = path.resolve(__uploads, filename);
        return fs.readFileSync(p);
    }, matchFileError);
};

export const readFileSync = (file: string): Result<string, FileError> => {
    return attempt(() => {
        const p = path.resolve(__root, file);
        return fs.readFileSync(p, 'utf-8');
    }, matchFileError);
};

export const readFile = (file: string): Promise<Result<string, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__root, file);
        return await fs.promises.readFile(p, 'utf-8');
    }, matchFileError);
};

export const saveFile = (
    file: string,
    data: string | ArrayBuffer
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__root, file);
        makeFolder(path.dirname(p));
        await fs.promises.writeFile(
            p,
            data instanceof ArrayBuffer ? new Uint8Array(data) : data
        );
    }, matchFileError);
};

export const saveFileSync = (
    file: string,
    data: string
): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__root, file);
        makeFolder(path.dirname(p));
        fs.writeFileSync(p, data);
    }, matchFileError);
};

export const removeFile = (file: string): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__root, file);
        await fs.promises.rm(p);
    }, matchFileError);
};

export const removeFileSync = (file: string): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__root, file);
        fs.rmSync(p);
    }, matchFileError);
};

export const readDir = (dir: string): Promise<Result<string[], FileError>> => {
    return attemptAsync(() => {
        return fs.promises.readdir(path.resolve(__root, dir));
    }, matchFileError);
};

export const readDirSync = (dir: string): Result<string[], FileError> => {
    return attempt(() => {
        return fs.readdirSync(path.resolve(__root, dir));
    }, matchFileError);
};

export const exists = (file: string): boolean => {
    return fs.existsSync(path.resolve(__root, file));
};

/**
 * Types of logs
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @typedef {LogType}
 */
export type LogType = 'request' | 'error' | 'debugger' | 'status' | 'console';

/**
 * The allowed types of data in a log (prevents deep objects)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @typedef {LogObj}
 */
export type LogObj = {
    [key: string]: string | number | boolean | undefined | null;
};

/**
 * Logs data to a csv file
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {LogType} type
 * @param {LogObj} dataObj
 * @returns {*}
 */
export function log(type: LogType, dataObj: LogObj): Promise<Result<void>> {
    return attemptAsync(async () => {
        createLogsFolder();
        new ObjectsToCsv([dataObj]).toDisk(
            path.resolve(__logs, `${type}.csv`),
            { append: true }
        );
    });
}
