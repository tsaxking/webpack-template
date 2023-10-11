import { __root } from "../../utilities/env.ts";
import PATH from 'npm:path';
import { log } from "../../utilities/terminal-logging.ts";
import stack from 'npm:callsite';
import { Colors } from "../../utilities/colors.ts";
import { StatusCode, StatusId } from "../../../shared/status-messages.ts";
import { Status } from "../../utilities/status.ts";
import { getTemplateSync } from "../../utilities/files.ts";
import { setCookie } from "https://deno.land/std@0.203.0/http/cookie.ts";
import { App } from "./app.ts";
import { Req } from "./req.ts";
import { CookieOptions } from "./app.ts";
import { ResponseStatus } from "./app.ts";
import { FileType } from "./app.ts";
import { EventEmitter } from "../../../shared/event-emitter.ts";


const fileTypeHeaders = {
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
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    mov: 'video/quicktime',
    mpeg: 'video/mpeg',
    flv: 'video/x-flv'
};


type StreamEventData = {
    'error': Error;
    'end': undefined;
    'cancel': undefined;
};

type StreamEvent = keyof StreamEventData;




export class Res {
    public readonly promise: Promise<Response>;
    public resolve?: (res: Response) => void;
    public reject?: (error: string) => void;
    public fulfilled: boolean = false;
    public readonly trace: string[] = [];
    private readonly app: App;
    public _status?: StatusCode;
    private readonly req: Req;

    private _cookie: {
        [key: string]: {
            value: string;
            options?: CookieOptions;
        }
    } = {};

    constructor(app: App, req: Req) {
        this.req = req;
        this.app = app;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    private isFulfilled() {
        if (this.fulfilled) {
            log('Response already fulfilled at:');
            return console.log(this.trace.filter(t => t!=='null:null').map(t => {
                t = t.replace('file://', '').replace('file:', '');
                t = PATH.relative(__root, t);
                t = `\n\t${Colors.FgYellow}${t}${Colors.Reset}`
                return t;
            }).join(''));
        }
        this.fulfilled = true;

        this.trace.push(...stack().map((site: any) => {
            return site.getFileName() + ':' + site.getLineNumber();
        }));
    }


    json(data: any): ResponseStatus {
        this.isFulfilled();
        try {
            const d = JSON.stringify(data);
            this.resolve?.(new Response(d, {
                status: this._status,
                headers: {
                    'Content-Type': 'application/json'
                }
            }));
            return ResponseStatus.success;
        } catch (e) {
            log("Cannot stringify data", e);
            return ResponseStatus.error;
        };
    }

    send(data: string, filetype: FileType = 'html'): ResponseStatus {
        this.isFulfilled();
        const res = new Response(data, {
            status: this._status,
            headers: {
                'Content-Type': fileTypeHeaders[filetype] || 'text/plain'
            }
        });
        this._setCookie(res);
        this.resolve?.(res);

        return ResponseStatus.success;
    }

    private _setCookie(res: Response) {
        for (const id in this._cookie) {
            const c = this._cookie[id];
            setCookie(res.headers, {
                name: id,
                value: c.value,
                ...c.options
            });
        }

        return ResponseStatus.success;
    }

    sendFile(path: string): ResponseStatus {
        // log('Sending file', path);
        try {
            this.isFulfilled();
            const extName = PATH.extname(path).replace('.', '');
            const data = Deno.readFileSync(path);
            const res = new Response(data, {
                status: this._status,
                headers: {
                    'Content-Type': fileTypeHeaders[extName as keyof typeof fileTypeHeaders] || 'text/plain'
                }
            });
            this._setCookie(res);
            this.resolve?.(res);
            return ResponseStatus.success;
        } catch (e) {
            log(e);
            return ResponseStatus.fileNotFound;
        }
    }


    status(status: StatusCode) {
        this._status = status;
        return this;
    }


    redirect(path: string): ResponseStatus {
        path = path.startsWith('/') ? this.app.domain + path : path;

        this.isFulfilled();
        this.resolve?.(Response.redirect(path));
        return ResponseStatus.success;
    }


    cookie(id: string, value: string, options?: CookieOptions) {
        this._cookie[id] = {
            value: value,
            options: options
        };
    }


    sendStatus(id: StatusId, data?: any): ResponseStatus {
        try {
            Status.from(id, this.req, data).send(this);
            return ResponseStatus.success;
        } catch (error) {
            log('Error sending status', error);
            return ResponseStatus.error;
        }
    };

    sendTemplate(template: string, options?: any): ResponseStatus {
        try {
            const t = getTemplateSync(template, options);
            this.send(t, 'html');
            return ResponseStatus.success;
        } catch (e) {
            log('Error sending template', e);
            return ResponseStatus.error;
        }
    }

    stream(content: string[]): EventEmitter<StreamEvent> {
        let timer: number;

        const em = new EventEmitter<StreamEvent>();

        const stream = new ReadableStream({
            start(controller) {
                const send = (n: number) => {
                    if (n >= content.length) {
                        em.emit('end');
                        controller.close();
                        clearInterval(timer);
                        return;
                    }
                    controller.enqueue(new TextEncoder().encode(content[n]));
                    i++;
                } 

                let i = 0;
                timer = setInterval(() => send(i), 10);
            },

            cancel() {
                if (timer) clearInterval(timer);
                
                em.emit('cancel');
            },

            type: 'bytes'
        });

        try {
            this.isFulfilled();

            this.resolve?.(new Response(stream, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-content-type-options': 'nosniff',
                    'x-content-size': new TextEncoder().encode(content.join('')).length.toString()
                }
            }))
        } catch (e) {
            log('Error streaming', e);

            em.emit('error', new Error(e));
        }

        return em;
    }
};