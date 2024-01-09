import { validCodes } from "../shared/status.ts";
import { messages, StatusCode, StatusColor, StatusId } from "../shared/status-messages.ts";
import { Colors } from "../server/utilities/colors.ts";
import { capitalize, fromSnakeCase, toCamelCase } from "../shared/text.ts";
import Filter from 'npm:bad-words';
import { repeatPrompt } from "./prompt.ts";



export const addSocket = (name: string) => {
    const file = Deno.readFileSync('./shared/socket.ts');
    const decoder = new TextDecoder();
    const decoded = decoder.decode(file);

    const [, end] = decoded.split('export type SocketEvent =');

    let events = end.split('|').map(i => i.trim().replace(';', '').replace(/\n/g, ''));
    events.push(`'${name}'`);

    events.sort((a, b) => {
        const [a1, a2] = a.split(':');
        const [b1, b2] = b.split(':');

        if (!a2 && !b2) return a1.localeCompare(b1);
        if (!a2) return -1;
        if (!b2) return 1;

        if (a1 === b1) {
            return a2.localeCompare(b2);
        }

        return a1.localeCompare(b1);
    });

    events = events.filter((i, index, arr) => arr.indexOf(i) === index);

    const newFile = `export type SocketEvent = 
      ${events.join('\n\t| ')}\n;`;
    Deno.writeFileSync('./shared/socket.ts', new TextEncoder().encode(newFile));
};

export const addStatus = (data: {
    group: string;
    name: string;
    message: string;
    color: string;
    code: StatusCode;
    instructions: string;
}) => {
    const value = data.group + ':' + data.name as StatusId;
    const obj = {
        message: data.message,
        color: data.color as StatusColor,
        code: data.code as StatusCode,
        instructions: data.instructions
    };

    if (messages[value]) throw new Error(`Status ${Colors.FgGreen}${value}${Colors.Reset} already exists`);

    messages[value] = obj;

    const str: string = (Object.keys(messages).sort((a, b) => {
        const [a1, a2] = a.split(':');
        const [b1, b2] = b.split(':');

        if (a1 === b1) {
            return a2.localeCompare(b2);
        }

        return a1.localeCompare(b1);
    }) as StatusId []).map((key: StatusId) => {
        return `    '${key}': {
    message: '${messages[key].message.replace(/'/g, '\\\'')}',
    color: '${messages[key].color}',
    code: ${messages[key].code},
    instructions: '${messages[key].instructions}'
}`;
    }).join(',\n');

    const groups = Object.keys(messages).reduce((acc, key) => {
        if (!acc[key.split(':')[0]]) acc[key.split(':')[0]] = [];
        acc[key.split(':')[0]].push(key.split(':')[1]);
        return acc;
    }, {
    } as any);


    const file = Deno.readFileSync('./shared/status-messages.ts');
    const decoder = new TextDecoder();
    const decoded = decoder.decode(file);

    const [, end] = decoded.split('export type StatusId =');

    let ids = end.split(';')[0].split('|').map(i => i.trim().replace(';', '').replace(/\n/g, ''));

    ids.push(`'${value}'`);

    ids = ids.sort().filter((i, index, arr) => arr.indexOf(i) === index);

    const newFile = `
export type StatusColor = 'success' | 'danger' | 'warning' | 'info';
export type StatusCode = 
    100 | 101 | 102 | 103 |
    200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 |
    300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 |
    400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 
        418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 |
    500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
export type StatusMessage = {
    message: string;
    color: StatusColor;
    code: StatusCode;
    instructions: string;
    redirect?: string;
}



export const messages: {
    [key in StatusId]: StatusMessage;
} = {
${str}
};

export type StatusId = ${ids.join('\n\t| ')}\n;

${Object.keys(groups).map(key => {
        return `export type ${capitalize(toCamelCase(fromSnakeCase(key, '-')))}StatusId = ${groups[key].map((i: string) => `'${i}'`).join('\n\t| ')};`
    }
).join('\n\n\n')}
`;

    Deno.writeFileSync('./shared/status-messages.ts', new TextEncoder().encode(newFile));

    if (data.code.toString().startsWith('2')) {
        addSocket(value);
    }
};


export const addStatusPrompt = () => {
    const allowedCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

    const parse = (str: string) => str.trim().toLowerCase().split('').filter(i => allowedCharacters.includes(i)).join('');
    const filter = (str: string): boolean => {
        if (str.length < 3) return false;
        const filter = new Filter();
        const filtered = filter.clean(str);
        if (filtered !== str) return false;
        return true;
    }

    const group = repeatPrompt('Status group', undefined, filter);
    const name = repeatPrompt('Status name', undefined, filter);
    const message = repeatPrompt('Status message', undefined, filter);
    const color = repeatPrompt('Status color', undefined, (i) => ['success', 'danger', 'warning', 'info'].includes(i));
    const code = repeatPrompt('Status code', undefined, (i) => validCodes.includes(+i as StatusCode));
    const instructions = prompt('Status instructions:') || '';

    addStatus({
        group: parse(group),
        name: parse(name),
        message: message,
        color,
        code: +code as StatusCode,
        instructions: parse(instructions)
    });
};


if (Deno.args.includes('status')) addStatusPrompt();
if (Deno.args.includes('socket')) {
    const name = repeatPrompt('Socket event name');
    addSocket(name);
};