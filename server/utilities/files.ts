import callsite from 'npm:callsite';
import * as htmlConstructor from 'npm:node-html-constructor';
import ObjectsToCsv from 'npm:objects-to-csv';
import {
    __logs,
    __root,
    __templates,
    __uploads,
    dirname,
    resolve,
} from './env.ts';
// import fs from 'node:fs';
import { attempt, attemptAsync, Result } from '../../shared/check.ts';
import { match, matchInstance } from '../../shared/match.ts';

export type JSONError = 'InvalidJSON' | 'Unknown';
export type FileError = 'NoFile' | 'FileExists' | 'NoAccess' | 'Unknown';

const matchJSONError = (e: Error): JSONError =>
    matchInstance<Error, JSONError>(
        e,
        [SyntaxError, () => 'InvalidJSON'],
        [Error, () => 'Unknown'],
    ) ?? 'Unknown';

const matchFileError = (e: Error): FileError =>
    match<Error, FileError>(
        e,
        [(e) => e.message.includes('ENOENT'), () => 'NoFile'],
        [(e) => e.message.includes('EEXIST'), () => 'FileExists'],
        [(e) => e.message.includes('EACCES'), () => 'NoAccess'],
        [(e) => e.message.includes('EISDIR'), () => 'NoAccess'],
    ) ?? 'Unknown';

/**
 * Used to render html templates
 * @date 1/9/2024 - 12:20:06 PM
 *
 * @type {*}
 */
const render = htmlConstructor.v4;

/**
 * Recursively Makes a folder if it does not exist
 * @date 10/12/2023 - 3:24:47 PM
 */
const makeFolder = (folder: string) => {
    try {
        const dirs = dirname(folder);
        Deno.mkdirSync(dirs, { recursive: true });
    } catch {
        console.log('Dir exists');
    }
};

/**
 * Used to build file paths, only to be used within this file
 * @date 10/12/2023 - 3:24:47 PM
 */
const filePathBuilder = (file: string, ext: string, parentFolder: string) => {
    let output: string;
    if (!file.endsWith(ext)) file += ext;

    if (file.startsWith('.')) {
        // use callsite
        const stack = callsite(),
            requester = stack[2].getFileName(),
            requesterDir = dirname(requester);
        output = resolve(requesterDir.replace('file:/', ''), file);
    } else {
        output = resolve(__root, parentFolder, ...file.split('/'));
    }

    return output;
};

/**
 * Removes all comments from a string
 * @date 10/12/2023 - 3:24:47 PM
 */
const removeComments = (content: string) => {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // multi line comments (js & css)
        .replace(/\/\/ .*/g, '') // single line comments (js)
        .replace(/<!--[\s\S]*?-->/g, ''); // html comments (html)
};

/**
 * returns the contents of a file
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @template [type=unknown]
 * @param {string} file
 * @returns {type}
 */
export function getJSONSync<type = unknown>(
    file: string,
): Result<type, JSONError> {
    return attempt<type, JSONError>(
        () => {
            const filePath = filePathBuilder(file, '.json', './storage/jsons/');
            const data = Deno.readFileSync(filePath);
            const decoder = new TextDecoder();
            const decoded = decoder.decode(data);

            return JSON.parse(removeComments(decoded));
        },
        (e) => {
            // if error
            return (
                matchInstance<Error, JSONError>(
                    e,
                    [SyntaxError, () => 'InvalidJSON'],
                    [Error, () => 'Unknown'],
                ) ?? 'InvalidJSON'
            );
        },
    );
}

/**
 * Returns the contents of a json file (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @template [type=unknown]
 * @param {string} file
 * @returns {Promise<type>}
 */
export function getJSON<type = unknown>(
    file: string,
): Promise<Result<type, JSONError>> {
    return new Promise((res, rej) => {
        attemptAsync<type, JSONError>(async () => {
            const filePath = filePathBuilder(file, '.json', './storage/jsons/');
            const data = await Deno.readFile(filePath);
            const decoder = new TextDecoder();
            const decoded = decoder.decode(data);

            return JSON.parse(removeComments(decoded));
        }, matchJSONError)
            .then(res)
            .catch(rej);
    });
}

/**
 * Returns the path to a json file
 * @date 1/9/2024 - 12:20:06 PM
 *
 * @export
 * @param {string} file
 * @returns {string}
 */
export function JSONPath(file: string): string {
    return filePathBuilder(file, '.json', './storage/jsons/');
}

/**
 * Saves a json file
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {*} data
 */
export function saveJSONSync<T = unknown>(
    file: string,
    data: T,
): Result<void, JSONError> {
    return attempt<void, JSONError>(() => {
        const str = JSON.stringify(data);

        const p = filePathBuilder(file, '.json', './storage/jsons/');
        makeFolder(p);
        Deno.writeFileSync(p, new TextEncoder().encode(str));
    }, matchJSONError);
}

/**
 * Saves a json file (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {*} data
 * @returns {*}
 */
export function saveJSON<T = unknown>(
    file: string,
    data: T,
): Promise<Result<void, JSONError>> {
    return new Promise((res, rej) => {
        attemptAsync(async () => {
            const str = JSON.stringify(data);

            const p = filePathBuilder(file, '.json', './storage/jsons/');
            makeFolder(p);
            await Deno.writeFile(p, new TextEncoder().encode(str));
        }, matchJSONError)
            .then(res)
            .catch(rej);
    });
}

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
 * Returns the contents of an html file
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {?{ [key: string]: any }} [options]
 * @returns {string}
 */
export function getTemplateSync(
    file: string,
    options?: Constructor,
): Result<string, FileError> {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates/');

        const data = Deno.readFileSync(p);
        const decoder = new TextDecoder();

        return options
            ? render(decoder.decode(data), options)
            : decoder.decode(data);
    }, matchFileError);
}

/**
 * Returns the contents of an html file (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {?{ [key: string]: any }} [options]
 * @returns {Promise<string>}
 */
export function getTemplate(
    file: string,
    options?: Constructor,
): Promise<Result<string, FileError>> {
    return new Promise((res, rej) => {
        attemptAsync(async () => {
            return new Promise<string>((r, rj) => {
                const p = filePathBuilder(file, '.html', './public/templates/');

                Deno.readFile(p)
                    .then((data) => {
                        const decoder = new TextDecoder();
                        const decoded = decoder.decode(data);

                        r(options ? render(decoded, options) : decoded);
                    })
                    .catch(rj);
            });
        }, matchFileError)
            .then(res)
            .catch(rej);
    });
}

/**
 * Saves an html file
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {string} data
 * @returns {*}
 */
export function saveTemplateSync(
    file: string,
    data: string,
): Result<void, FileError> {
    return attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates/');
        makeFolder(p);
        Deno.writeFileSync(p, new TextEncoder().encode(data));
    }, matchFileError);
}

/**
 * Saves an html file (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {string} data
 * @returns {*}
 */
export function saveTemplate(
    file: string,
    data: string,
): Promise<Result<void, FileError>> {
    return attemptAsync(async () => {
        const p = filePathBuilder(file, '.html', './public/templates/');
        makeFolder(p);
        Deno.writeFile(p, new TextEncoder().encode(data));
    }, matchFileError);
}

/**
 * Creates the uploads folder if it does not exist
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createUploadsFolder = (): Result<void, FileError> => {
    return attempt(() => {
        Deno.mkdirSync(__uploads, { recursive: true });
    }, matchFileError);
};

/**
 * Creates the logs folder if it does not exist
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createLogsFolder = (): Result<void, FileError> => {
    return attempt(() => {
        Deno.mkdirSync(__logs, { recursive: true });
    }, matchFileError);
};

/**
 * Saves a file to the uploads folder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @param {Uint8Array} data
 * @returns {*}
 */
export function saveUpload(
    filename: string,
    data: Uint8Array,
): Promise<Result<void, FileError>> {
    return attemptAsync(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);

        return Deno.writeFile(p, data);
    }, matchFileError);
}

/**
 * Returns the contents of a file in the uploads folder (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUpload(
    filename: string,
): Promise<Result<Uint8Array, FileError>> {
    return attemptAsync(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.readFile(p);
    }, matchFileError);
}

/**
 * Returns the contents of a file in the uploads folder (sync)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUploadSync(filename: string): Result<Uint8Array, FileError> {
    return attempt(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.readFileSync(p);
    }, matchFileError);
}

/**
 * Deletes a file in the uploads folder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function deleteUpload(
    filename: string,
): Promise<Result<void, FileError>> {
    return attemptAsync(async () => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.remove(p);
    }, matchFileError);
}

/**
 * The different types of byte sizes
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @typedef {Bytes}
 */
type Bytes = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB';

/**
 * Formats a number of bytes into a string
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {number} bytes
 * @param {number} [decimals=2]
 * @returns {{ string: string, type: Bytes }}
 */
export function formatBytes(
    bytes: number,
    decimals = 2,
): { string: string; type: Bytes } {
    if (bytes === 0) {
        return {
            string: '0 Bytes',
            type: 'Bytes',
        };
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes: Bytes[] = [
        'Bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB',
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return {
        string: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' +
            sizes[i],
        type: sizes[i],
    };
}

export const readFileSync = (file: string): Result<string, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '', '');
        return Deno.readTextFileSync(p);
    }, matchFileError);
};

export const readFile = (file: string): Promise<Result<string, FileError>> => {
    return attemptAsync(() => {
        const p = filePathBuilder(file, '', '');
        return Deno.readTextFile(p);
    }, matchFileError);
};

export const saveFileSync = (
    file: string,
    data: string,
): Result<void, FileError> => {
    return attempt(() => {
        const p = filePathBuilder(file, '', '');
        makeFolder(p);
        Deno.writeTextFileSync(p, data);
    }, matchFileError);
};

export const saveFile = (
    file: string,
    data: string,
): Promise<Result<void, FileError>> => {
    return attemptAsync(() => {
        const p = filePathBuilder(file, '', '');
        makeFolder(p);
        return Deno.writeTextFile(p, data);
    }, matchFileError);
};

export const readDir = (path: string): Promise<Result<Deno.DirEntry[]>> => {
    return attemptAsync(async () => {
        const dir = Deno.readDir(path);
        const entries: Deno.DirEntry[] = [];
        for await (const entry of dir) entries.push(entry);
        return entries;
    });
};

export const readDirSync = (path: string): Result<Deno.DirEntry[]> => {
    return attempt(() => {
        const dir = Deno.readDirSync(path);
        const entries: Deno.DirEntry[] = [];
        for (const entry of dir) entries.push(entry);
        return entries;
    });
};

export const exists = (path: string): Promise<boolean> =>
    new Promise((res) => {
        Deno.stat(path)
            .then(() => res(true))
            .catch(() => res(false));
    });

export const existsSync = (path: string): boolean => {
    try {
        Deno.statSync(path);
        return true;
    } catch {
        return false;
    }
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
    return attemptAsync(() => {
        createLogsFolder();
        return new ObjectsToCsv([dataObj]).toDisk(
            resolve(__logs, `${type}.csv`),
            { append: true },
        );
    });
}
