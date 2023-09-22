import path from 'node:path';
import callsite from 'npm:callsite';
import { v4 as render } from 'npm:node-html-constructor';
import ObjectsToCsv from 'npm:objects-to-csv';
import { log as terminalLog } from "./terminal-logging.ts";
import { __root, __uploads } from "./env.ts";



const filePathBuilder = (file: string, ext: string, parentFolder: string) => {
    let output: string;
    if (!file.endsWith(ext)) file += ext;

    if (file.startsWith('.')) {
        // use callsite
        const stack = callsite(),
            requester = stack[1].getFileName(),
            requesterDir = path.dirname(requester);
        output = path.resolve(requesterDir, file);
    } else {
        output = path.resolve(__root, parentFolder, ...file.split('/'));
    }


    return output;
}

const removeComments = (content: string) => {
    // remove all /* */ comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // remove all // comments
    content = content.replace(/\/\/ .*/g, '');

    return content;
}



export function getJSONSync<type = unknown>(file: string): type {
    const filePath = filePathBuilder(file, '.json', './storage/jsons/');
    const data = Deno.readFileSync(filePath);
    const decoder = new TextDecoder();
    const decoded = decoder.decode(data);

    const parsed = JSON.parse(removeComments(decoded));
    return parsed as type;
}


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

export function saveJSONSync(file: string, data: any) {
    const p = filePathBuilder(file, '.json', './storage/jsons/');

    try {
        data = JSON.stringify(data, null, 4);
    } catch {
        throw new Error('Invalid JSON');
    }

    Deno.writeFileSync(p, data);
}

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


export function getTemplateSync(file: string, options?: { [key: string]: any }): string {
    const p = filePathBuilder(file, '.html', './public/templates/');

    const data = Deno.readFileSync(p);
    const decoder = new TextDecoder();

    return options ? render(decoder.decode(data), options) : decoder.decode(data);
}

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

export function saveTemplateSync(file: string, data: string) {
    const p = filePathBuilder(file, '.html', './public/templates/');

    return Deno.writeFileSync(p, new TextEncoder().encode(data));
}

export function saveTemplate(file: string, data: string) {
    const p = filePathBuilder(file, '.html', './public/templates/');

    return Deno.writeFile(p, new TextEncoder().encode(data));
}



export const createUploadsFolder = () => {
    const p = filePathBuilder('', '', __uploads);

    if (!Deno.statSync(p).isDirectory) {
        terminalLog('Creating uploads folder');
        Deno.mkdirSync(p);
    }
};







export function saveUpload(filename: string, data: Uint8Array) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);

    return Deno.writeFile(p, data);
}

export function getUpload(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.readFile(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}


export function getUploadSync(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.readFileSync(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}

export function deleteUpload(filename: string) {
    createUploadsFolder();
    const p = filePathBuilder(filename, '', __uploads);
    try {
        return Deno.remove(p);
    } catch {
        terminalLog('error', `Could not delete file ${filename} because it likely does not exist`);
    }
}


type Bytes = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB';

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


export type LogType = 'request' | 'error' | 'debugger' | 'status';

export type LogObj = {
    [key: string]: string|number|boolean|undefined|null;
}



export function log(type: LogType, dataObj: LogObj) {
    return new ObjectsToCsv([dataObj]).toDisk(
        path.resolve(__root, '../../storage/logs/', `${type}.csv`),
        { append: true }
    );
}