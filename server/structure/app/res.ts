import { __root, relative, unify } from '../../utilities/env.ts';
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
import { readFile } from '../../utilities/files.ts';

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
    public trace: string[] = [];
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
    }

    get headers() {
        return this.req.ctx.response.headers;
    }

    isFulfilled(): boolean {
        if (!this.fulfilled) return false;

        this.trace = blog.callsites().map((site) => {
            const p = site.getFileName() || '';
            return `${relative(__root, unify(p))}:${site.getLineNumber()}`;
        });

        // remove the first two traces
        this.trace.shift();
        this.trace.shift();

        return true;
    }

    /**
     * Responds in json format
     * @date 10/12/2023 - 3:06:02 PM
     *
     * @param {*} data
     * @returns {ResponseStatus}
     */
    json(data: unknown): ResponseStatus {
        try {
            if (this.isFulfilled()) return ResponseStatus.alreadyFulfilled;

            const d = JSON.stringify(data);
            this.headers.set('content-type', 'application/json');
            this.req.ctx.response.body = d;
            this.fulfilled = true;
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
        if (this.isFulfilled()) return ResponseStatus.alreadyFulfilled;

        this.headers.set('content-type', fileTypeHeaders[filetype]);
        this.req.ctx.response.body = data;
        this.fulfilled = true;

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
    async sendFile(path: string): Promise<ResponseStatus> {
        // log('Sending file', path);
        try {
            if (this.isFulfilled()) return ResponseStatus.alreadyFulfilled;

            const file = await readFile(path);
            this.headers.set(
                'content-type',
                fileTypeHeaders[path.split('.').pop() || 'html'],
            );
            this.req.ctx.response.body = file;
            this.fulfilled = true;

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
        this.req.ctx.response.redirect(path);
        this.fulfilled = true;

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

        setCookie(this.headers, {
            name: id,
            value,
            ...options,
        });

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
            const status = Status.from(id, this.req, data);
            if (redirect) status.redirect = redirect;

            status.send(this);

            return ResponseStatus.success;
        } catch (error) {
            log('Error sending status', error);
            return ResponseStatus.error;
        }
    }

    sendCustomStatus(status: Status): ResponseStatus {
        try {
            status.send(this);
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
    async sendTemplate(
        template: string,
        options?: Constructor,
    ): Promise<ResponseStatus> {
        try {
            const t = await getTemplate(template, options);
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

        this.headers.set('content-type', 'octet/stream');
        this.req.ctx.response.body = stream;

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
