// make a class that simulates npm:express using the deno std library
import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.1.1/mod.ts";
import { __root } from "../utilities/env.ts";
import PATH from 'npm:path';
import { log } from "../utilities/terminal-logging.ts";
import { Session } from "./sessions.ts";
import stack from 'npm:callsite';
import { Colors } from "../utilities/colors.ts";

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


export class Req {
    readonly params: {
        [key: string]: string
    };

    readonly session?: Session;
    body: any;
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;
    readonly pathname: string;
    readonly query: URLSearchParams;

    constructor(public readonly req: Request) {
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this.pathname = new URL(req.url, 'http://localhost').pathname;
        this.query = new URL(req.url, 'http://localhost').searchParams;
        this.params = extractParams('/api', this.pathname);

        const cookie = req.headers.get('cookie');
        if (cookie) {
            this.session = Session.get(cookie);
        }
    }
};

export class Res {
    public readonly promise: Promise<Response>;
    public resolve?: (res: Response) => void;
    public reject?: (error: string) => void;
    public fulfilled: boolean = false;
    public readonly trace: string[] = [];

    constructor() {
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
                t = `\t${Colors.FgYellow}${t}${Colors.Reset}`
                return t;
            }).join('\n'));
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
                headers: {
                    'Content-Type': 'application/json'
                }
            }));
        } catch {};
    }

    send(data: string) {
        this.isFulfilled();
        this.resolve?.(new Response(data));
    }

    sendFile(path: string) {
        this.isFulfilled();
        const extName = PATH.extname(path).replace('.', '');
        const data = Deno.readFileSync(path);
        this.resolve?.(new Response(data, {
            headers: {
                'Content-Type': fileTypeHeaders[extName as keyof typeof fileTypeHeaders] || 'text/plain'
            }
        }));
    }
};




export class Route {
    public readonly serverFunctions: ServerFunctionHandler[] = [];


    constructor(public readonly path: string) {
    }



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
    onConnection?: () => void;
    onDisconnect?: () => void;
    ioPort?: number;
};


export class App {
    public readonly io: Server = new Server();
    public readonly server: Deno.Server;

    constructor(public readonly port: number, public readonly domain: string, options?: AppOptions) {
        this.server = Deno.serve({ port: this.port }, (req: Request) => this.handler(req));

        if (options) {
            if (options.onListen) {
                options.onListen(this.server);
            }

            if (options.ioPort) {
                serve(this.io.handler(), { port: options.ioPort });
            }
        }
    };

    private async handler(denoReq: Request): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            const extName = PATH.extname(denoReq.url).replace('.', '');
            const url = new URL(denoReq.url, this.domain);


            const fns = this.serverFunctions.filter(sf => {
                if (sf.method !== denoReq.method) return false;
                if (sf.path === url.pathname) return true;
                if (sf.path.endsWith('*')) {
                    const pathParts = sf.path.split('/');
                    const urlParts = url.pathname.split('/');

                    if (pathParts.length !== urlParts.length) return false;

                    for (let i = 0; i < pathParts.length; i++) {
                        if (pathParts[i] === '*') return true;
                        if (pathParts[i].startsWith(':')) continue;
                        if (pathParts[i] !== urlParts[i]) return false;
                    }

                    return true;
                }

                return false;
            });

            console.log(fns);

            const req = new Req(denoReq);
            const res = new Res();

            const runFn = async (i: number) => {
                const fn = fns[i] as ServerFunctionHandler | undefined;
                if (!fn && !res.fulfilled) {
                    return res.reject?.(`No response to ${req.method}: ${req.pathname}`);
                }

                const next = () => {
                    runFn(i + 1);
                }

                return fn?.callback(req, res, next);
            };

            runFn(0);


            await res.promise
                .then((response: Response) => {
                    resolve(response);
                })
                .catch((e: Error) => {
                    log(e);
                });

            if (!res.fulfilled) resolve(new Response('404: Page not found', {
                headers: {
                    'Content-Type': 'text/plain'
                }
            }));
        });

    }

    private readonly serverFunctions: ServerFunctionHandler[] = [];



    static(path: string, filePath: string) {
        this.get(path + '/*', async (req) => {
            return Deno.readFile(
                PATH.resolve(
                    __root,
                    filePath,
                    '.' + req.url.replace(path, '').replace(this.domain, '')
                )
            )
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
