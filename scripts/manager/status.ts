import { filter, selectBootstrapColor, title } from '../manager';
import { repeatPrompt, select, prompt } from '../prompt';
import { StatusCode } from '../../shared/status-messages';
import { addSocket, addStatus } from '../add-status';
import { backToMain } from '../manager';
import fs from 'fs';
import path from 'path';

export const selectStatusCode = async (): Promise<number> => {
    const level = await select('Select a status code level', [
        {
            name: '1xx (Informational)',
            value: 1
        },
        {
            name: '2xx (Success)',
            value: 2
        },
        {
            name: '3xx (Redirection)',
            value: 3
        },
        {
            name: '4xx (Client Error)',
            value: 4
        },
        {
            name: '5xx (Server Error)',
            value: 5
        }
    ]);

    switch (level) {
        case 1:
            return await select('Select a 1xx status code', [
                {
                    name: '100 Continue',
                    value: 100
                },
                {
                    name: '101 Switching Protocols',
                    value: 101
                },
                {
                    name: '102 Processing',
                    value: 102
                },
                {
                    name: '103 Early Hints',
                    value: 103
                }
            ]);

        case 2:
            return await select('Select a 2xx status code', [
                {
                    name: '200 OK',
                    value: 200
                },
                {
                    name: '201 Created',
                    value: 201
                },
                {
                    name: '202 Accepted',
                    value: 202
                },
                {
                    name: '203 Non-Authoritative Information',
                    value: 203
                },
                {
                    name: '204 No Content',
                    value: 204
                },
                {
                    name: '205 Reset Content',
                    value: 205
                },
                {
                    name: '206 Partial Content',
                    value: 206
                },
                {
                    name: '207 Multi-Status',
                    value: 207
                },
                {
                    name: '208 Already Reported',
                    value: 208
                },
                {
                    name: '226 IM Used',
                    value: 226
                }
            ]);
        case 3:
            return await select('Select a 3xx status code', [
                {
                    name: '300 Multiple Choices',
                    value: 300
                },
                {
                    name: '301 Moved Permanently',
                    value: 301
                },
                {
                    name: '302 Found',
                    value: 302
                },
                {
                    name: '303 See Other',
                    value: 303
                },
                {
                    name: '304 Not Modified',
                    value: 304
                },
                {
                    name: '305 Use Proxy',
                    value: 305
                },
                {
                    name: '306 Switch Proxy',
                    value: 306
                },
                {
                    name: '307 Temporary Redirect',
                    value: 307
                },
                {
                    name: '308 Permanent Redirect',
                    value: 308
                }
            ]);
        case 4:
            return await select('Select a 4xx status code', [
                {
                    name: '400 Bad Request',
                    value: 400
                },
                {
                    name: '401 Unauthorized',
                    value: 401
                },
                {
                    name: '402 Payment Required',
                    value: 402
                },
                {
                    name: '403 Forbidden',
                    value: 403
                },
                {
                    name: '404 Not Found',
                    value: 404
                },
                {
                    name: '405 Method Not Allowed',
                    value: 405
                },
                {
                    name: '406 Not Acceptable',
                    value: 406
                },
                {
                    name: '407 Proxy Authentication Required',
                    value: 407
                },
                {
                    name: '408 Request Timeout',
                    value: 408
                },
                {
                    name: '409 Conflict',
                    value: 409
                },
                {
                    name: '410 Gone',
                    value: 410
                },
                {
                    name: '411 Length Required',
                    value: 411
                },
                {
                    name: '412 Precondition Failed',
                    value: 412
                },
                {
                    name: '413 Payload Too Large',
                    value: 413
                },
                {
                    name: '414 URI Too Long',
                    value: 414
                },
                {
                    name: '415 Unsupported Media Type',
                    value: 415
                },
                {
                    name: '416 Range Not Satisfiable',
                    value: 416
                },
                {
                    name: '417 Expectation Failed',
                    value: 417
                },
                {
                    name: "418 I'm a teapot",
                    value: 418
                },
                {
                    name: '421 Misdirected Request',
                    value: 421
                },
                {
                    name: '422 Unprocessable Entity',
                    value: 422
                },
                {
                    name: '423 Locked',
                    value: 423
                },
                {
                    name: '424 Failed Dependency',
                    value: 424
                },
                {
                    name: '425 Too Early',
                    value: 425
                },
                {
                    name: '426 Upgrade Required',
                    value: 426
                },
                {
                    name: '428 Precondition Required',
                    value: 428
                },
                {
                    name: '429 Too Many Requests',
                    value: 429
                },
                {
                    name: '431 Request Header Fields Too Large',
                    value: 431
                },
                {
                    name: '451 Unavailable For Legal Reasons',
                    value: 451
                }
            ]);
        case 5:
            return await select('Select a 5xx status code', [
                {
                    name: '500 Internal Server Error',
                    value: 500
                },
                {
                    name: '501 Not Implemented',
                    value: 501
                },
                {
                    name: '502 Bad Gateway',
                    value: 502
                },
                {
                    name: '503 Service Unavailable',
                    value: 503
                },
                {
                    name: '504 Gateway Timeout',
                    value: 504
                },
                {
                    name: '505 HTTP Version Not Supported',
                    value: 505
                },
                {
                    name: '506 Variant Also Negotiates',
                    value: 506
                },
                {
                    name: '507 Insufficient Storage',
                    value: 507
                },
                {
                    name: '508 Loop Detected',
                    value: 508
                },
                {
                    name: '510 Not Extended',
                    value: 510
                },
                {
                    name: '511 Network Authentication Required',
                    value: 511
                }
            ]);
        default:
            throw new Error('Invalid status code level');
    }
};

export const createStatus = async () => {
    // const text = Deno.readTextFileSync('shared/status-messages.ts');
    const text = fs.readFileSync(
        path.join('shared', 'status-messages.ts'),
        'utf-8'
    );

    const allStatuses = Array.from(text.matchAll(/('[\w:-]+'):/g)); // match all status message names

    const groups = allStatuses.map(i => i[0].match(/[\w-]+/));

    let group = await select<string>('Select a status group:', [
        '[new]',
        ...groups
            .map(i => (i ? i[0] : null))
            .filter(Boolean)
            .filter((g, i, a) => a.indexOf(g) === i)
    ] as string[]);

    if (group === '[new]') {
        group = await repeatPrompt(
            'Enter the new status group name',
            undefined,
            data => {
                const has = allStatuses.some(i => i[0] === `'${data}:'`);
                if (has) {
                    console.log('Group already exists');
                    return false;
                }

                return filter(data);
            },
            false
        );
    }

    const name = await repeatPrompt(
        'Enter the status name',
        undefined,
        data => {
            const has = allStatuses.some(i => i[0] === `'${group}':${data}`);
            if (has) {
                console.log('Status already exists');
                return false;
            }
            return filter(data);
        },
        false
    );

    const message = await repeatPrompt(
        'Enter the status message',
        undefined,
        filter
    );
    const color = await selectBootstrapColor('Select a color');
    const code = (await selectStatusCode()) as StatusCode;
    const instructions =
        (await prompt('Enter the status instructions (if any)')) || '';
    const redirect =
        (await prompt('Enter the status redirect (if any)')) || undefined;

    addStatus({
        group,
        name,
        message,
        color,
        code,
        instructions,
        redirect
    });

    backToMain(`Status ${group}:${name} (${code}) created`);
};

export const addSocketEvent = async () => {
    title('Create a socket event');

    // const text = Deno.readTextFileSync('shared/socket.ts');
    const text = fs.readFileSync(path.join('shared', 'socket.ts'), 'utf-8');

    const currentSockets = Array.from(text.matchAll(/'([\w:-]+)'/g));

    const socketEvent = await repeatPrompt(
        'Please enter a socket name',
        undefined,
        data => !currentSockets.find(m => m[0] === `'${data}'`),
        false
    );

    addSocket(socketEvent);

    backToMain(`Socket event ${socketEvent} created`);
};

// TODO: remove status and remove socket event
// export const removeStatus = async () => {};
// export const removeSocketEvent = async () => {};

export const statuses = [
    {
        icon: '📝',
        value: createStatus,
        description: 'Create a front-end status message'
    },
    // {
    //     icon: '🗑️',
    //     value: removeStatus,
    // },
    {
        icon: '🔌',
        value: addSocketEvent,
        description: 'Create a socket event'
    }
    // {
    //     icon: '🗑️',
    //     value: removeSocketEvent,
    // },
];
