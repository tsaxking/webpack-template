// make a class that simulates npm:express using the deno std library
import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { __root } from "../utilities/env.ts";
import PATH from 'npm:path';
import { log } from "../utilities/terminal-logging.ts";
import { Session } from "./sessions.ts";
import stack from 'npm:callsite';
import { Colors } from "../utilities/colors.ts";
import { StatusCode, StatusId } from "../../shared/status.ts";
import { Status } from "../utilities/status.ts";
import { getTemplateSync } from "../utilities/files.ts";
import { parseCookie } from "../../shared/cookie.ts";
import { deleteCookie, setCookie, getCookies } from "https://deno.land/std/http/cookie.ts";

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

export type FileType = 
    'js' | 
    'css' |
    'html' |
    'json' |
    'png' |
    'jpg' |
    'jpeg' |
    'gif' |
    'svg' |
    'ico' |
    'ttf' |
    'woff' |
    'woff2' |
    'otf' |
    'eot' |
    'mp4' |
    'webm' |
    'mp3' |
    'wav' |
    'ogg' |
    'txt' |
    'pdf' |
    'zip' |
    'rar' |
    'tar' |
    '7z' |
    'xml' |
    'doc' |
    'docx' |
    'xls' |
    'xlsx' |
    'ppt' |
    'pptx' |
    'avi' |
    'wmv' |
    'mov' |
    'mpeg' |
    'flv';


export class Req {
    private _cookie?: {
        [key: string]: string
    };

    public params: Record<string, string> = {};
    body: any;
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;
    readonly pathname: string;
    readonly query: URLSearchParams;
    readonly ip: string = 'localhost';
    readonly start: number = Date.now();

    constructor(public readonly req: Request, info: Deno.ServeHandlerInfo, public readonly io: Server) {
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this.pathname = new URL(req.url, 'http://localhost').pathname;
        this.query = new URL(req.url, 'http://localhost').searchParams;
        this.ip = info.remoteAddr.hostname;
    }

    get cookie(): {
        [key: string]: string
    } {
        if (this._cookie) return this._cookie;

        const c = parseCookie(this.headers.get('cookie') || '');
        this._cookie = c;
        return c;
    }


    addCookie(name: string, value: string) {
        this._cookie = {
            ...this.cookie,
            [name]: value
        };
    }



    get session(): Session {
        const s = Session.get(this.cookie.ssid);
        if (!s) throw new Error('No session found for req');
        return s;
    }
};


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


    json(data: any) {
        this.isFulfilled();
        try {
            const d = JSON.stringify(data);
            this.resolve?.(new Response(d, {
                status: this._status,
                headers: {
                    'Content-Type': 'application/json'
                }
            }));
        } catch {};
    }

    send(data: string, filetype: FileType = 'html') {
        this.isFulfilled();
        const res = new Response(data, {
            status: this._status,
            headers: {
                'Content-Type': fileTypeHeaders[filetype] || 'text/plain'
            }
        });
        this._setCookie(res);
        this.resolve?.(res);
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
    }

    sendFile(path: string) {
        // log('Sending file', path);
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
    }


    status(status: StatusCode) {
        this._status = status;
        return this;
    }


    redirect(path: string) {
        this.isFulfilled();
        this.resolve?.(Response.redirect(this.app.domain + path));
    }


    cookie(id: string, value: string, options?: CookieOptions) {
        this._cookie[id] = {
            value: value,
            options: options
        };
    }


    sendStatus(id: StatusId, data?: any) {
        return Status.from(id, this.req, data).send(this);
    };

    sendTemplate(template: string, options?: any) {
        this.send(getTemplateSync(template, options));
    }
};

export type CookieOptions = {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
}


export class Route {
    public readonly serverFunctions: ServerFunctionHandler[] = [];

    get(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }

    post(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.POST
        })));

        return this;
    }


    use(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }



    route(path: string, route: Route) {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        return this;
    }
}

enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export type Next = () => void;

export type ServerFunction = (req: Req, res: Res, next: Next) => any;
type ServerFunctionHandler = {
    path: string;
    callback: ServerFunction;
    method: RequestMethod;
}

type AppOptions = {
    onListen?: (server: Deno.Server) => void;
    onConnection?: (socket: any) => void;
    onDisconnect?: () => void;
    ioPort?: number;
};


export class App {
    public readonly io: Server;
    public readonly server: Deno.Server;

    constructor(public readonly port: number, public readonly domain: string, options?: AppOptions) {
        this.server = Deno.serve({ port: this.port }, (req: Request, info: Deno.ServeHandlerInfo) => this.handler(req, info));
        this.io = new Server();

        if (options) {
            if (options.onListen) {
                options.onListen(this.server);
            }

            if (options.ioPort) {
                serve(this.io.handler(), { port: options.ioPort });
            }

            if (options.onConnection) {
                this.io.on('connection', options.onConnection);
            }

            if (options.onDisconnect) {
                this.io.on('disconnect', options.onDisconnect);
            }
        }
    };

    private async handler(denoReq: Request, info: Deno.ServeHandlerInfo): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            const url = new URL(denoReq.url, this.domain);


            const fns = this.serverFunctions.filter(sf => {
                // get rid of query
                const path = url.pathname.split('?')[0];
                if (sf.method !== denoReq.method) return false;
                const pathParts = sf.path.split('/');
                const urlParts = path.split('/');

                // if (pathParts.length !== urlParts.length) return false;


                const test = pathParts.every((part, i) => {
                    // log(part, urlParts[i]);

                    if (part === '*') return true;
                    if (part.startsWith(':')) return true;
                    return part === urlParts[i];
                });

                // log(test);

                return test;
            });

            fns.push(...this.finalFunctions.map(fn => ({
                path: '',
                callback: fn,
                method: RequestMethod.GET
            })));

            // log(`[${denoReq.method}] ${denoReq.url}`, fns);

            const req = new Req(denoReq, info, this.io);
            const res = new Res(this, req);

            const cookie = parseCookie(req.headers.get('cookie') || '').ssid;
            if (!cookie) {
                Session.newSession(req, res);
            } else {
                Session.get(cookie) || Session.newSession(req, res);
            }

            const runFn = async (i: number) => {
                const fn = fns[i] as ServerFunctionHandler | undefined;

                if (!fn) {
                    if (!res.fulfilled) {
                        // there was no response
                        return res.reject?.(`No response to ${req.method}: ${req.pathname}`);
                    }

                    // if the request was responded to, then the promise was resolved already.
                    return;
                }

                let ranNext = false;

                req.params = extractParams(fn.path, req.pathname);

                const next = (): void => {
                    runFn(i + 1);
                    ranNext = true;
                };
                
                
                try {
                    await fn.callback(req, res, next);
                } catch (e) {
                    log(`Error on callback [${req.method}] ${req.url}`, e);
                }
                    
                if (!ranNext && !res.fulfilled && fns[i + 1]) {
                    const site = stack().map((site: any) => {
                        return site.getFileName() + ':' + site.getLineNumber();
                    });
                    const str = site.filter((t: string) => t!=='null:null').map((t: string) => {
                        t = t.replace('file://', '').replace('file:', '');
                        t = PATH.relative(__root, t);
                        t = `\n\t${Colors.FgYellow}${t}${Colors.Reset}`
                        return t;
                    }).join('');

                    log(`Request ${req.method}: ${req.pathname} was not resolved and did not call next() at ${str}`);
                }
            };

            try {
                runFn(0);

                await res.promise
                    .then((response: Response) => {
                        resolve(response);
                    })
                    .catch((e: Error) => {
                        log(e);
                    });

            } catch (e) {
                log(e);
            }
        });

    }

    private readonly serverFunctions: ServerFunctionHandler[] = [];
    private readonly finalFunctions: ServerFunction[] = [];


    static(path: string, filePath: string) {
        this.get(path + '/*', async (req, res, next) => {
            // log('Sending file:', filePath + req.pathname.replace(path, ''), req.pathname);
            res.sendFile(filePath + req.pathname.replace(path, ''));
        });
    }



    get(path: string, ...callbacks: ServerFunction[]): App {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }


    use(path: string, ...callback: ServerFunction[]): App {
        this.serverFunctions.push(...callback.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));
        return this;
    }

    post(path: string, ...callback: ServerFunction[]): App {
        this.serverFunctions.push(...callback.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.POST
        })));

        return this;
    }


    route(path: string, route: Route): App {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        return this;
    }


    final(callback: ServerFunction): App {
        this.finalFunctions.push(callback);
        return this;
    }
}


const extractParams = (path: string, url: string): {
    [key: string]: string
} => {
    const params: {
        [key: string]: string
    } = {};
    const pathParts = path.split('/');
    const urlParts = url.split('/');

    for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i].startsWith(':')) {
            params[pathParts[i].replace(':', '')] = urlParts[i];
        }
    }

    return params;
};
