import render from 'node-html-constructor/versions/v4';
import ObjectsToCsv from 'objects-to-csv';
import { __logs, __root, __templates, __uploads } from './env';
import { attempt, attemptAsync, Result } from '../../shared/check';
import { matchInstance } from '../../shared/match';
import { error } from './terminal-logging';
import fs from 'fs';
import path from 'path';
import callsite from 'callsite';

/**
 * Error types for json operations
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @export
 * @typedef {JSONError}
 */
export type JSONError = 'InvalidJSON' | 'Unknown';
/**
 * Error types for file operations
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @export
 * @typedef {FileError}
 */
export type FileError = 'NoFile' | 'FileExists' | 'NoAccess' | 'Unknown';

/**
 * Matches an error to a JSONError
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {Error} e
 * @returns {JSONError}
 */
const matchJSONError = (e: Error): JSONError => {
    console.log(e);
    return (
        matchInstance<Error, JSONError>(
            e,
            [SyntaxError, () => 'InvalidJSON'],
            [Error, () => 'Unknown']
        ) ?? 'Unknown'
    );
};

/**
 * Matches an error to a FileError
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {Error} e
 * @returns {FileError}
 */
const matchFileError = (e: Error): FileError => {
    console.log(e);
    return (
        matchInstance<Error, FileError>(
            e,
            [Error, () => 'Unknown'],
            [TypeError, () => 'NoFile'],
            [Error, () => 'FileExists'],
            [Error, () => 'NoAccess']
        ) ?? 'Unknown'
    );
};

/**
 * Makes a folder
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} folder
 */
const makeFolder = (folder: string) => {
    return attempt(() => {
        return fs.mkdirSync(folder, { recursive: true });
    });
};

/**
 * Builds a file path based on the file, extension, and directory
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @param {string} ext
 * @param {string} dir
 * @returns {string}
 */
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

/**
 * Removes comments from a string (js, css, html)
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} content
 * @returns {*}
 */
const removeComments = (content: string) => {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // multi line comments (js & css)
        .replace(/\/\/ .*/g, '') // single line comments (js)
        .replace(/<!--[\s\S]*?-->/g, ''); // html comments (html)
};

/**
 * Returns the content of a json file as an object, if there is an error it returns a Err<JSONError>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @template [T=unknown]
 * @param {string} file
 * @returns {Result<T, JSONError>}
 */
export const getJSONSync = <T = unknown>(
    file: string
): Result<T, JSONError> => {
    return attempt(() => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(removeComments(data)) as T;
    }, matchJSONError);
};

/**
 * Returns the content of a json file as an object, if there is an error it returns a Promise<Err<JSONError>>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @template [T=unknown]
 * @param {string} file
 * @returns {Promise<Result<T, JSONError>>}
 */
export const getJSON = <T = unknown>(
    file: string
): Promise<Result<T, JSONError>> => {
    return attemptAsync(async () => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(removeComments(data)) as T;
    }, matchJSONError);
};

/**
 * Saves data to a json file, if there is an error it returns a Err<JSONError>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @template [T=unknown]
 * @param {string} file
 * @param {T} data
 * @returns {Result<void, JSONError>}
 */
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

/**
 * Saves data to a json file, if there is an error it returns a Promise<Err<JSONError>>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @template [T=unknown]
 * @param {string} file
 * @param {T} data
 * @returns {Promise<Result<void, JSONError>>}
 */
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

/**
 * Removes a json file, if there is an error it returns a Err<JSONError>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @returns {Result<void, JSONError>}
 */
export const removeJSONSync = (file: string): Result<void, JSONError> => {
    return attempt(() => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        fs.rmSync(filePath);
    }, matchJSONError);
};

/**
 * Removes a json file, if there is an error it returns a Promise<Err<JSONError>>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @returns {Promise<Result<void, JSONError>>}
 */
export const removeJSON = (file: string): Promise<Result<void, JSONError>> => {
    return attemptAsync(async () => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons');
        await fs.promises.rm(filePath);
    }, matchJSONError);
};

/**
 * Constructor type for rendering templates
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @export
 * @typedef {Constructor}
 */
export type Constructor = {
    [key: string]:
        | string
        | number
        | boolean
        | undefined
        | Constructor[]
        | Constructor;
};

/**
 * Returns the content of an html file as a string, applying node-html-constructor to it, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @param {?Constructor} [options]
 * @returns {Result<string, FileError>}
 */
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

/**
 * Returns the content of an html file as a string, applying node-html-constructor to it, if there is an error it returns a Promise<Err<FileError>>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @param {?Constructor} [options]
 * @returns {Promise<Result<string, FileError>>}
 */
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

/**
 * Saves data to a html file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @param {string} data
 * @returns {Result<void, FileError>}
 */
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

/**
 * Saves data to a html file, if there is an error it returns a Promise<Err<FileError>>
 * @date 3/8/2024 - 5:50:09 AM
 *
 * @param {string} file
 * @param {string} data
 * @returns {Promise<Result<void, FileError>>}
 */
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

/**
 * Removes a html file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Result<void, FileError>}
 */
export const removeTemplateSync = (file: string): Result<void, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates');
        fs.rmSync(p);
    }, matchFileError);
};

/**
 * Removes a html file, if there is an error it returns a Promise<Err<FileError>>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Promise<Result<void, FileError>>}
 */
export const removeTemplate = (
    file: string
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = filePathBuilder(file, '.html', './public/templates');
        await fs.promises.rm(p);
    }, matchFileError);
};

/**
 *  Creates the uploads folder
 * @date 3/8/2024 - 5:50:08 AM
 */
export const createUploadsFolder = () => makeFolder(__uploads);
/**
 * Creates the logs folder
 * @date 3/8/2024 - 5:50:08 AM
 */
export const createLogsFolder = () => makeFolder(__logs);

/**
 * Saves uploaded files to the uploads folder
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @param {Uint8Array} data
 * @returns {Promise<Result<void, FileError>>}
 */
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

/**
 * Saves uploaded files to the uploads folder
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @param {Uint8Array} data
 * @returns {Result<void, FileError>}
 */
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

/**
 * Removes an uploaded file from the uploads folder
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @returns {Promise<Result<void, FileError>>}
 */
export const removeUpload = (
    filename: string
): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__uploads, filename);
        await fs.promises.rm(p);
    }, matchFileError);
};

/**
 * Removes an uploaded file from the uploads folder
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @returns {Result<void, FileError>}
 */
export const removeUploadSync = (filename: string): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__uploads, filename);
        fs.rmSync(p);
    }, matchFileError);
};

/**
 * Returns the content of an uploaded file as a Uint8Array, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @returns {Promise<Result<Uint8Array, FileError>>}
 */
export const getUpload = (
    filename: string
): Promise<Result<Uint8Array, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__uploads, filename);
        return await fs.promises.readFile(p);
    }, matchFileError);
};

/**
 * Returns the content of an uploaded file as a Uint8Array, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} filename
 * @returns {Result<Uint8Array, FileError>}
 */
export const getUploadSync = (
    filename: string
): Result<Uint8Array, FileError> => {
    return attempt(() => {
        const p = path.resolve(__uploads, filename);
        return fs.readFileSync(p);
    }, matchFileError);
};

/**
 * Returns the content of a file as a string, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Result<string, FileError>}
 */
export const readFileSync = (file: string): Result<string, FileError> => {
    return attempt(() => {
        const p = path.resolve(__root, file);
        return fs.readFileSync(p, 'utf-8');
    }, matchFileError);
};

/**
 * Returns the content of a file as a string, if there is an error it returns a Promise<Err<FileError>>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Promise<Result<string, FileError>>}
 */
export const readFile = (file: string): Promise<Result<string, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__root, file);
        return await fs.promises.readFile(p, 'utf-8');
    }, matchFileError);
};

/**
 * Saves data to a file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @param {(string | ArrayBuffer)} data
 * @returns {Promise<Result<void, FileError>>}
 */
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

/**
 * Saves data to a file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @param {string} data
 * @returns {Result<void, FileError>}
 */
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

/**
 * Removes a file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Promise<Result<void, FileError>>}
 */
export const removeFile = (file: string): Promise<Result<void, FileError>> => {
    return attemptAsync(async () => {
        const p = path.resolve(__root, file);
        await fs.promises.rm(p);
    }, matchFileError);
};

/**
 * Removes a file, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {Result<void, FileError>}
 */
export const removeFileSync = (file: string): Result<void, FileError> => {
    return attempt(() => {
        const p = path.resolve(__root, file);
        fs.rmSync(p);
    }, matchFileError);
};

/**
 * Reads the contents of a directory, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} dir
 * @returns {Promise<Result<string[], FileError>>}
 */
export const readDir = (dir: string): Promise<Result<string[], FileError>> => {
    return attemptAsync(() => {
        return fs.promises.readdir(path.resolve(__root, dir));
    }, matchFileError);
};

/**
 * Reads the contents of a directory, if there is an error it returns a Err<FileError>
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} dir
 * @returns {Result<string[], FileError>}
 */
export const readDirSync = (dir: string): Result<string[], FileError> => {
    return attempt(() => {
        return fs.readdirSync(path.resolve(__root, dir));
    }, matchFileError);
};

/**
 * Checks if a file exists
 * @date 3/8/2024 - 5:50:08 AM
 *
 * @param {string} file
 * @returns {boolean}
 */
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
export type LogType =
    | 'request'
    | 'error'
    | 'debugger'
    | 'status'
    | 'console'
    | 'queries';

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
