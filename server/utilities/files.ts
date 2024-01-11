import callsite from 'npm:callsite';
import * as htmlConstructor from 'npm:node-html-constructor';
import ObjectsToCsv from 'npm:objects-to-csv';
import { log as terminalLog } from './terminal-logging.ts';
import {
    __logs,
    __root,
    __templates,
    __uploads,
    dirname,
    resolve,
} from './env.ts';
import fs from 'node:fs';
import { attempt, attemptAsync } from '../../shared/attempt.ts';

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
        Deno.mkdirSync(
            dirs,
            { recursive: true },
        );
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
export function getJSONSync<type = unknown>(file: string): type | null {
    const filePath = filePathBuilder(file, '.json', './storage/jsons/');
    const data = Deno.readFileSync(filePath);
    const decoder = new TextDecoder();
    const decoded = decoder.decode(data);

    return attempt<type>(JSON.parse(removeComments(decoded)));
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
export function getJSON<type = unknown>(file: string): Promise<type | null> {
    return new Promise<type | null>((res, rej) => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons/');
        Deno.readFile(filePath)
            .then((data) => {
                const decoder = new TextDecoder();
                const decoded = decoder.decode(data);

                const parsed = attempt<type>(
                    JSON.parse(removeComments(decoded)),
                );
                res(parsed);
            })
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
export function saveJSONSync(file: string, data: any) {
    attempt(() => {
        const p = filePathBuilder(file, '.json', './storage/jsons/');
        makeFolder(p);
        Deno.writeFileSync(
            p,
            new TextEncoder().encode(data),
        );
    });
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
export function saveJSON(file: string, data: any) {
    return new Promise<void>((res, rej) => {
        attempt(() => {
            const p = filePathBuilder(file, '.json', './storage/jsons/');
            makeFolder(p);
            Deno.writeFile(
                p,
                new TextEncoder().encode(data),
            )
                .then(res)
                .catch(rej);
        });
    });
}

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
    options?: { [key: string]: any },
): string {
    const p = filePathBuilder(file, '.html', './public/templates/');

    const data = Deno.readFileSync(p);
    const decoder = new TextDecoder();

    return options
        ? render(decoder.decode(data), options)
        : decoder.decode(data);
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
    options?: { [key: string]: any },
): Promise<string> {
    return new Promise<string>((res, rej) => {
        const p = filePathBuilder(file, '.html', './public/templates/');

        Deno.readFile(p)
            .then((data) => {
                const decoder = new TextDecoder();
                const decoded = decoder.decode(data);

                res(options ? render(decoded, options) : decoded);
            })
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
export function saveTemplateSync(file: string, data: string) {
    attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates/');
        makeFolder(p);
        Deno.writeFileSync(
            p,
            new TextEncoder().encode(data),
        );
    });
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
export function saveTemplate(file: string, data: string) {
    attempt(() => {
        const p = filePathBuilder(file, '.html', './public/templates/');
        makeFolder(p);
        Deno.writeFile(
            p,
            new TextEncoder().encode(data),
        );
    });
}

/**
 * Creates the uploads folder if it does not exist
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createUploadsFolder = () => {
    attempt(() => {
        if (!fs.existsSync(__uploads)) {
            terminalLog('Creating uploads folder');
            fs.mkdirSync(__uploads);
        }
    });
};

/**
 * Creates the logs folder if it does not exist
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createLogsFolder = () => {
    attempt(() => {
        if (!fs.existsSync(__logs)) {
            terminalLog('Creating logs folder');
            fs.mkdirSync(__logs);
        }
    });
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
export function saveUpload(filename: string, data: Uint8Array) {
    return attemptAsync(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);

        return Deno.writeFile(p, data);
    });
}

/**
 * Returns the contents of a file in the uploads folder (async)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUpload(filename: string) {
    return attemptAsync(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.readFile(p);
    });
}

/**
 * Returns the contents of a file in the uploads folder (sync)
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUploadSync(filename: string) {
    return attempt(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.readFileSync(p);
    });
}

/**
 * Deletes a file in the uploads folder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function deleteUpload(filename: string) {
    return attempt(() => {
        createUploadsFolder();
        const p = filePathBuilder(filename, '', __uploads);
        return Deno.remove(p);
    });
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
    decimals: number = 2,
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

/**
 * Types of logs
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @typedef {LogType}
 */
export type LogType = 'request' | 'error' | 'debugger' | 'status';

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
export function log(type: LogType, dataObj: LogObj) {
    return attempt(() => {
        createLogsFolder();
        return new ObjectsToCsv([dataObj]).toDisk(
            resolve(__logs, `${type}.csv`),
            { append: true },
        );
    });
}
