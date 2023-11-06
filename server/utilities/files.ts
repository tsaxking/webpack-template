import path from 'node:path';
import callsite from 'npm:callsite';
import * as htmlConstructor from 'npm:node-html-constructor';
import ObjectsToCsv from 'npm:objects-to-csv';
import { log as terminalLog } from "./terminal-logging.ts";
import { __root, __uploads, __logs, __templates } from "./env.ts";
import fs from 'node:fs';

const render = htmlConstructor.v4;

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 */
const makeFolder = (folder: string) => {
    const dirs = folder.split('/');

    let mainDir = '';

    for (const dir of dirs) {
        if (dir.includes('.')) continue;

        mainDir = path.resolve(mainDir, dir);
        if (!fs.existsSync(mainDir)) {
            fs.mkdirSync(mainDir);
        }
    }
};


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 */
const filePathBuilder = (file: string, ext: string, parentFolder: string) => {
    let output: string;
    if (!file.endsWith(ext)) file += ext;

    if (file.startsWith('.')) {
        // use callsite
        const stack = callsite(),
            requester = stack[2].getFileName(),
            requesterDir = path.dirname(requester);
        output = path.resolve(requesterDir.replace('file:/',''), file);
    } else {
        output = path.resolve(__root, parentFolder, ...file.split('/'));
    }


    return output;
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 */
const removeComments = (content: string) => {
    // remove all /* */ comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // remove all // comments
    content = content.replace(/\/\/ .*/g, '');

    return content;
}



/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @template [type=unknown]
 * @param {string} file
 * @returns {type}
 */
export function getJSONSync<type = unknown>(file: string): type {
    const filePath = filePathBuilder(file, '.json', './storage/jsons/');
    const data = Deno.readFileSync(filePath);
    const decoder = new TextDecoder();
    const decoded = decoder.decode(data);

    const parsed = JSON.parse(removeComments(decoded));
    return parsed as type;
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @template [type=unknown]
 * @param {string} file
 * @returns {Promise<type>}
 */
export function getJSON<type = unknown>(file: string): Promise<type> {
    return new Promise<type>((res, rej) => {
        const filePath = filePathBuilder(file, '.json', './storage/jsons/');
        Deno.readFile(filePath)
            .then(data => {
                const decoder = new TextDecoder();
                const decoded = decoder.decode(data);

                const parsed = JSON.parse(removeComments(decoded));
                res(parsed as type);
            })
            .catch(rej);
    });
}

export function JSONPath (file: string): string {
    return filePathBuilder(file, '.json', './storage/jsons/');
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {*} data
 */
export function saveJSONSync(file: string, data: any) {
    const p = filePathBuilder(file, '.json', './storage/jsons/');

    try {
        data = JSON.stringify(data, null, 4);
    } catch {
        throw new Error('Invalid JSON');
    }

    Deno.writeFileSync(p, data);
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {*} data
 * @returns {*}
 */
export function saveJSON(file: string, data: any) {
    return new Promise<void>((res, rej) => {
        const p = filePathBuilder(file, '.json', './storage/jsons/');

        try {
            data = JSON.stringify(data, null, 4);
        } catch {
            rej(new Error('Invalid JSON'));
        }

        Deno.writeFile(p, data)
            .then(res)
            .catch(rej);
    });
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {?{ [key: string]: any }} [options]
 * @returns {string}
 */
export function getTemplateSync(file: string, options?: { [key: string]: any }): string {
    const p = filePathBuilder(file, '.html', './public/templates/');

    const data = Deno.readFileSync(p);
    const decoder = new TextDecoder();

    return options ? render(decoder.decode(data), options) : decoder.decode(data);
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {?{ [key: string]: any }} [options]
 * @returns {Promise<string>}
 */
export function getTemplate(file: string, options?: { [key: string]: any }): Promise<string> {
    return new Promise<string>((res, rej) => {
        const p = filePathBuilder(file, '.html', './public/templates/');

        Deno.readFile(p)
            .then(data => {
                const decoder = new TextDecoder();
                const decoded = decoder.decode(data);

                res(options ? render(decoded, options) : decoded);
            })
            .catch(rej);
    });
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {string} data
 * @returns {*}
 */
export function saveTemplateSync(file: string, data: string) {
    const p = filePathBuilder(file, '.html', './public/templates/');

    makeFolder(path.relative(__templates, p));

    return Deno.writeFileSync(p, new TextEncoder().encode(data));
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} file
 * @param {string} data
 * @returns {*}
 */
export function saveTemplate(file: string, data: string) {
    const p = filePathBuilder(file, '.html', './public/templates/');

    makeFolder(path.relative(__templates, p));

    return Deno.writeFile(p, new TextEncoder().encode(data));
}



/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createUploadsFolder = () => {
    if (!fs.existsSync(__uploads)) {
        terminalLog('Creating uploads folder');
        fs.mkdirSync(__uploads);
    }
};

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 */
export const createLogsFolder = () => {
    if (!fs.existsSync(__logs)) {
        terminalLog('Creating logs folder');
        fs.mkdirSync(__logs);
    }
}





/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @param {Uint8Array} data
 * @returns {*}
 */
export function saveUpload(filename: string, data: Uint8Array) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);

    return Deno.writeFile(p, data);
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUpload(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.readFile(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function getUploadSync(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.readFileSync(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {string} filename
 * @returns {*}
 */
export function deleteUpload(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.remove(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @typedef {Bytes}
 */
type Bytes = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB';

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {number} bytes
 * @param {number} [decimals=2]
 * @returns {{ string: string, type: Bytes }}
 */
export function formatBytes(bytes: number, decimals: number = 2): { string: string, type: Bytes } {
    if (bytes === 0) return {
        string: '0 Bytes',
        type: 'Bytes'
    };

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes: Bytes[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return {
        string: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i],
        type: sizes[i]
    }
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @typedef {LogType}
 */
export type LogType = 'request' | 'error' | 'debugger' | 'status';

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @typedef {LogObj}
 */
export type LogObj = {
    [key: string]: string|number|boolean|undefined|null;
}



/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:47 PM
 *
 * @export
 * @param {LogType} type
 * @param {LogObj} dataObj
 * @returns {*}
 */
export function log(type: LogType, dataObj: LogObj) {
    createLogsFolder();
    return new ObjectsToCsv([dataObj]).toDisk(
        path.resolve(__logs, `${type}.csv`),
        { append: true }
    );
}