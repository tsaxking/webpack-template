import { __root } from '../../utilities/env.ts';
import PATH from 'npm:path';
import { log } from '../../utilities/terminal-logging.ts';
import { Colors } from '../../utilities/colors.ts';
import { StatusCode, StatusId } from '../../../shared/status-messages.ts';
import { Status } from '../../utilities/status.ts';
import {
    Constructor,
    getTemplate,
    getTemplateSync,
} from '../../utilities/files.ts';
import { setCookie } from 'https://deno.land/std@0.203.0/http/cookie.ts';
import { App } from './app.ts';
import { Req } from './req.ts';
import { CookieOptions } from './app.ts';
import { ResponseStatus } from './app.ts';
import { FileType } from './app.ts';
import { EventEmitter } from '../../../shared/event-emitter.ts';
import { streamDelimiter } from '../../../shared/text.ts';
import * as blog from 'https://deno.land/x/blog@0.3.3/deps.ts';
import { sleep } from '../../../shared/sleep.ts';
import { bigIntDecode, bigIntEncode } from '../../../shared/objects.ts';

/**
 * All filetype headers (used for sending files, this is not a complete list)
 * @date 10/12/2023 - 3:06:02 PM
 *
 * @type {{ js: string; css: string; html: string; json: string; png: string; jpg: string; jpeg: string; gif: string; svg: string; ico: string; ttf: string; woff: string; woff2: string; otf: string; eot: string; mp4: string; ... 21 more ...; flv: string; }}
 */
const fileTypeHeaders: {
    [key: string]: string;
} = {
    js: 'application/javascript',
    css: 'text/css',
    html: 'text/html',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    txt: 'text/plain',
    pdf: 'application/pdf',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    xml: 'application/xml',
    doc: 'application/msword',
    docx:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    mov: 'video/quicktime',
    mpeg: 'video/mpeg',
    flv: 'video/x-flv',
};

/**
 * The event types for the stream
 * @date 10/12/2023 - 3:06:02 PM
 *
 * @typedef {StreamEventData}
 */
type StreamEventData = {
    error: Error;
    end: undefined;
    cancel: undefined;
};

/**
 * This is the response object, resembling the express response object
 * @date 10/12/2023 - 3:06:02 PM
 *
 * @export
 * @class Res
 * @typedef {Res}
 */
export class Res {
    /**
     * This is resolved when the response is sent
     * Only to be use internally
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @readonly
     * @type {Promise<Response>}
     */
    public readonly promise: Promise<Response>;
    /**
     * The resolve function for the promise
     * Only to be use internally
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @type {?(res: Response) => void}
     */
    public resolve?: (res: Response) => void;
    /**
     * The reject function for the promise
     * Only to be use internally
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @type {?(error: string) => void}
     */
    public reject?: (error: string) => void;
    /**
     * Whether or not the response has been fulfilled
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @type {boolean}
     */
    public fulfilled = false;
    /**
     * The trace of the response (uses npm:callsite)
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @readonly
     * @type {string[]}
     */
    public readonly trace: string[] = [];
    /**
     * The application object
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @private
     * @readonly
     * @type {App}
     */
    private readonly app: App;
    /**
     * The status code of the response (defaults to 200)
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @public
     * @type {?StatusCode}
     */
    public _status?: StatusCode;
    /**
     * The request object
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @private
     * @readonly
     * @type {Req}
     */
    private readonly req: Req;

    /**
     * The cookie object
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @private
     * @type {{
            [key: string]: {
                value: string;
                options?: CookieOptions;
            }
        }}
     */
    private _cookie: {
        [key: string]: {
            value: string;
            options?: CookieOptions;
        };
    } = {};

    /**
     * Creates an instance of Res.
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @constructor
     * @param {App} app
     * @param {Req} req
     */
    constructor(app: App, req: Req) {
        this.req = req;
        this.app = app;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    /**
     * Tests whether or not the response has been fulfilled, if it has, it will log the trace
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @private
     * @returns {*}
     */
    private isFulfilled(): void | undefined {
        if (this.fulfilled) {
            log('Response already fulfilled at:');
            return console.log(
                this.trace
                    .filter((t) => t !== 'null:null')
                    .map((t) => {
                        t = t.replace('file://', '').replace('file:', '');
                        t = PATH.relative(__root, t);
                        t = `\n\t${Colors.FgYellow}${t}${Colors.Reset}`;
                        return t;
                    })
                    .join(''),
            );
        }
        this.fulfilled = true;

        const stack = blog.callsites();

        this.trace.push(
            ...stack.map((site) => {
                return site.getFileName() + ':' + site.getLineNumber();
            }),
        );
    }

    /**
     * Responds in json format
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @param {*} data
     * @returns {ResponseStatus}
     */
    json(data: unknown): ResponseStatus {
        this.isFulfilled();
        try {
            const d = JSON.stringify(bigIntEncode(data));
            this.resolve?.(
                new Response(d, {
                    status: this._status,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            );
            return ResponseStatus.success;
        } catch (e) {
            log('Cannot stringify data', e);
            return ResponseStatus.error;
        }
    }

    /**
     * Sends data to the client
     * Fulfils the response
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @param {string} data
     * @param {FileType} [filetype='html']
     * @returns {ResponseStatus}
     */
    send(data: string, filetype: FileType = 'html'): ResponseStatus {
        this.isFulfilled();
        const res = new Response(data, {
            status: this._status,
            headers: {
                'Content-Type': fileTypeHeaders[filetype] || 'text/plain',
            },
        });
        // console.log(this);
        this._setCookie(res);
        this.resolve?.(res);

        return ResponseStatus.success;
    }

    /**
     * Sets the cookie for the response
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @private
     * @param {Response} res
     * @returns {ResponseStatus}
     */
    private _setCookie(res: Response) {
        for (const id in this._cookie) {
            const c = this._cookie[id];
            setCookie(res.headers, {
                name: id,
                value: c.value,
                ...c.options,
            });
        }

        return ResponseStatus.success;
    }

    /**
     * Sends a file to the client
     * Fulfils the response
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {string} path
     * @returns {ResponseStatus}
     */
    sendFile(path: string): ResponseStatus {
        // log('Sending file', path);
        try {
            this.isFulfilled();
            const extName = PATH.extname(path).replace('.', '');
            const data = Deno.readFileSync(path);
            const res = new Response(data, {
                status: this._status,
                headers: {
                    'Content-Type': fileTypeHeaders[
                        extName as keyof typeof fileTypeHeaders
                    ] || 'text/plain',
                },
            });
            this._setCookie(res);
            this.resolve?.(res);
            return ResponseStatus.success;
        } catch (e) {
            log(e);
            return ResponseStatus.fileNotFound;
        }
    }

    /**
     * Sets the status code of the response
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {StatusCode} status
     * @returns {this}
     */
    status(status: StatusCode): this {
        this._status = status;
        return this;
    }

    /**
     * Redirects the client to the given path
     * Fulfils the response
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {string} path
     * @returns {ResponseStatus}
     */
    redirect(path: string): ResponseStatus {
        path = path.startsWith('/') ? this.app.domain + path : path;

        this.isFulfilled();
        this.resolve?.(Response.redirect(path));
        return ResponseStatus.success;
    }

    /**
     * Adds a cookie to the response
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {string} id
     * @param {string} value
     * @param {?CookieOptions} [options]
     * @returns {this}
     */
    cookie(id: string, value: string, options?: CookieOptions): this {
        this._cookie[id] = {
            value: value,
            options: options,
        };

        this.req.cookie[id] = value;

        return this;
    }

    /**
     * Sends a status to the client (using the StatusMessages in shared/status-messages.ts)
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {StatusId} id
     * @param {?*} [data]
     * @returns {ResponseStatus}
     */
    sendStatus(
        id: StatusId,
        data?: unknown,
        redirect?: string,
    ): ResponseStatus {
        try {
            const s = Status.from(
                id,
                this.req,
                JSON.stringify(bigIntEncode(data)),
            );
            s.redirect = redirect || s.redirect;
            s.send(this);
            return ResponseStatus.success;
        } catch (error) {
            log('Error sending status', error);
            return ResponseStatus.error;
        }
    }

    /**
     * Sends a template to the client (utilizes node-html-constructor to build the template)
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {string} template
     * @param {?*} [options]
     * @returns {ResponseStatus}
     */
    sendTemplate(template: string, options?: Constructor): ResponseStatus {
        try {
            const t = getTemplateSync(template, options);
            if (t.isErr()) throw new Error(t.error);
            this.send(t.value, 'html');
            return ResponseStatus.success;
        } catch (e) {
            log('Error sending template', e);
            return ResponseStatus.error;
        }
    }

    /**
     * Streams the given content to the client
     * @date 10/12/2023 - 3:06:01 PM
     *
     * @param {string[]} content
     * @returns {EventEmitter<keyof StreamEventData>}
     */
    stream(content: unknown[]): EventEmitter<keyof StreamEventData> {
        let timer: number;

        const em = new EventEmitter<keyof StreamEventData>();

        const stream = new ReadableStream({
            // send chunks when the event loop is free
            start(controller) {
                const send = (n: number) => {
                    if (n >= content.length) {
                        em.emit('end');
                        controller.close();
                        return;
                    }
                    controller.enqueue(
                        new TextEncoder().encode(
                            JSON.stringify(bigIntEncode(content[n])),
                        ),
                    );
                    i++;
                    timer = setTimeout(() => send(i));
                };

                let i = 0;
                timer = setTimeout(() => send(i));
            },

            cancel() {
                if (timer) clearTimeout(timer);
                em.emit('cancel');
            },

            type: 'bytes',
        });

        try {
            this.isFulfilled();

            this.resolve?.(
                new Response(stream, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'x-content-type-options': 'nosniff',
                        'x-content-size': new TextEncoder()
                            .encode(content.join(''))
                            .length.toString(),
                        'x-data-length': content.length.toString(),
                    },
                }),
            );
        } catch (e) {
            log('Error streaming', e);

            em.emit('error', new Error(e));
        }

        return em;
    }

    /**
     * Renders a template to the client (utilizes node-html-constructor to build the template)
     * @date 1/9/2024 - 1:15:37 PM
     *
     * @async
     * @param {string} template
     * @param {*} constructor
     * @returns {*}
     */
    async render(template: string, constructor: Constructor) {
        try {
            const t = await getTemplate(template, constructor);
            if (t.isErr()) throw new Error(t.error);
            this.send(t.value, 'html');
        } catch (e) {
            log('Error rendering template', e);
            this.sendStatus('server:unknown-server-error');
        }
    }
}
