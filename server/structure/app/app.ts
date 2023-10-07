// make a class that simulates npm:express using the deno std library
import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import env, { __root } from "../../utilities/env.ts";
import PATH from 'npm:path';
import { log } from "../../utilities/terminal-logging.ts";
import { Session } from "../sessions.ts";
import stack from 'npm:callsite';
import { Colors } from "../../utilities/colors.ts";
import { parseCookie } from "../../../shared/cookie.ts";
import { Req } from "./req.ts";
import { Res } from "./res.ts";


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




export enum ResponseStatus {
    fileNotFound,
    success,
    error
}



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
    public readonly finalFunctions: FinalFunction[] = [];

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

    final(callback: FinalFunction) {
        this.finalFunctions.push(callback);
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
export type FinalFunction = (req: Req, res: Res) => any;

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
    // private readonly routes: {
    //     [key: string]: Route
    // } = {};

    constructor(public readonly port: number, public readonly domain: string, options?: AppOptions) {
        this.server = Deno.serve({ port: this.port }, (req: Request, info: Deno.ServeHandlerInfo) => this.handler(req, info));
        this.io = new Server({
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => {
            log('New connection:', socket.id);

            // socket.join(socket.id);

            // join tab session
            const { ssid } = parseCookie(socket.handshake.headers.get('cookie') || '');
            if (ssid) socket.join(ssid);

            if (env.ENVIRONMENT === 'dev') {
                socket.emit('reload');
            }
        });


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

            const finals = this.finalFunctions;

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

            // log(`[${denoReq.method}] ${denoReq.url}`, fns);

            const req = new Req(denoReq, info, this.io);
            const res = new Res(this, req);

            // log(parseCookie(denoReq.headers.get('cookie') || ''));

            const cookie = parseCookie(req.headers.get('cookie') || '').ssid;
            if (!cookie) {
                Session.newSession(req, res);
            } else {
                Session.get(cookie) || Session.newSession(req, res);
            }

            req.body = await req.req.json().catch(() => {});

            const runFn = async (i: number) => {
                return new Promise<void>(async (resolve) => {
                    // log('Running fn', i +'/'+ fns.length);

                    const fn = fns[i] as ServerFunctionHandler | undefined;

                    if (!fn) {
                        if (!res.fulfilled) {
                            // there was no response
                            resolve();
                            return res.reject?.(`No response to ${req.method}: ${req.pathname}`);
                        }

                        // if the request was responded to, then the promise was resolved already.
                        return resolve();
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
                        resolve();
                    }
                });
            };


            try {
                runFn(0).then(() => {
                    for (const fn of this.finalFunctions) {
                        fn(req, res);
                    }
                });

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
    private readonly finalFunctions: FinalFunction[] = [];


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
        // this.routes[path] = route;
        return this;
    }


    final(callback: FinalFunction): App {
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
