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


/**
 * All file types that can be sent (can be expanded)
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {FileType}
 */
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




/**
 * Enum for response status
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @enum {number}
 */
export enum ResponseStatus {
    fileNotFound,
    success,
    error
}



/**
 * Options to apply to cookies
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {CookieOptions}
 */
export type CookieOptions = {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
}


/**
 * This class is used to group requests together from a single pathname
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @class Route
 * @typedef {Route}
 */
export class Route {
    /**
     * These are all of the server functions that are grouped together
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {ServerFunctionHandler[]}
     */
    public readonly serverFunctions: ServerFunctionHandler<any>[] = [];
    /**
     * These are all of the final functions that are grouped together (run at the end of the request)
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {FinalFunction[]}
     */
    public readonly finalFunctions: FinalFunction<any>[] = [];

    /**
     * Adds a get middleware function to the route
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callbacks
     * @returns {this}
     */
    get(path: string | ServerFunction<null>, ...callbacks: ServerFunction<null>[]): this {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callbacks.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.GET
            })));
        } else {
            this.serverFunctions.push(...[path, ...callbacks].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.GET
            })));
        }
        return this;
    }

    /**
     * Adds a post middleware function to the route
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callbacks
     * @returns {this}
     */
    post<T>(path: string | ServerFunction<T>, ...callbacks: ServerFunction<T>[]): this {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callbacks.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.POST
            } as ServerFunctionHandler<T>)));
        } else {
            this.serverFunctions.push(...[path, ...callbacks].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.POST
            } as ServerFunctionHandler<T>)));
        }
        return this;
    }


    /**
     * Adds a middleware function that is run for every request that matches the rout and path
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callbacks
     * @returns {this}
     */
    use(path: string | ServerFunction<any>, ...callbacks: ServerFunction<any>[]): this {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callbacks.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.GET
            })));
        } else {
            this.serverFunctions.push(...[path, ...callbacks].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.GET
            })));
        }
        return this;
    }



    /**
     * Adds a route to the route
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {Route} route
     * @returns {this}
     */
    route(path: string, route: Route): this {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        return this;
    }

    /**
     * Adds a final function to the route
     * @date 10/12/2023 - 2:49:37 PM
     * @deprecated Use App.final instead
     *
     * @param {FinalFunction} callback
     * @returns {this}
     */
    final(callback: FinalFunction<any>): this {
        this.finalFunctions.push(callback);
        return this;
    }
}

/**
 * All of the request methods that are supported
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @enum {number}
 */
enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

/**
 * "Next" function that is called to move to the next middleware function
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {Next}
 */
export type Next = () => void;

/**
 * Server function that is called when a request is made
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {ServerFunction}
 */
export type ServerFunction<T> = (req: Req<T>, res: Res, next: Next) => any | Promise<any>;
/**
 * Final function that is called at the end of a request
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {FinalFunction}
 */
export type FinalFunction<T> = (req: Req<T>, res: Res) => any;

/**
 * Object that contains the path and callback for a server function
 * This is only used internally
 * @private
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @typedef {ServerFunctionHandler}
 */
type ServerFunctionHandler<T> = {
    path: string;
    callback: ServerFunction<T>;
    method: RequestMethod;
}

/**
 * Options for starting the application
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @typedef {AppOptions}
 */
type AppOptions = {
    onListen?: (server: Deno.Server) => void;
    onConnection?: (socket: any) => void;
    onDisconnect?: () => void;
    ioPort?: number;
};


/**
 * This is the main application class, this is used to create a server and listen for requests
 * It is designed to be as similar as possible to npm:express while using the Deno.Server functionality
 * All middleware functions are surrounded by a try/catch block to prevent the server from crashing
 * There are warnings for when a request is either not responded to, or is responded to multiple times
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @class App
 * @typedef {App}
 */
export class App {
    /**
     * Socket.io server
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {Server}
     */
    public readonly io: Server;
    /**
     * Deno server
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {Deno.Server}
     */
    public readonly server: Deno.Server;

    /**
     * Creates an instance of App.
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @constructor
     * @param {number} port
     * @param {string} domain
     * @param {?AppOptions} [options]
     */
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
    }

    /**
     * This is the main handler for all requests
     * Only used internally
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @private
     * @async
     * @param {Request} denoReq
     * @param {Deno.ServeHandlerInfo} info
     * @returns {Promise<Response>}
     */
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


                const test = pathParts.every((part: string, i: number) => {
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

            req.body = await req.req.json().catch(() => {}) as {
                [key: string]: any
            } || {}

            const runFn = async (i: number) => {
                return new Promise<void>(async (resolve) => {
                    // log('Running fn', i +'/'+ fns.length);

                    const fn = fns[i] as ServerFunctionHandler<any> | undefined;

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
                        if (res.fulfilled) res.sendStatus('unknown:error');
                    }
                    if (!ranNext && !res.fulfilled && fns[i + 1]) {
                        const site = stack().map((site: any) => {
                            return site.getFileName() + ':' + site.getLineNumber();
                        });
                        const str = site.filter((t: string) => t!=='null:null').map((t: string) => {
                            t = t.replace('file://', '').replace('file:', '');
                            t = PATH.relative(__root, t);
                            t = `\n\t${Colors.FgYellow}${t}${Colors.Reset}`;
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

    /**
     * All of the server functions that are grouped together
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @private
     * @readonly
     * @type {ServerFunctionHandler[]}
     */
    private readonly serverFunctions: ServerFunctionHandler<any>[] = [];
    /**
     * All of the final functions that are grouped together (run at the end of the request)
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @private
     * @readonly
     * @type {FinalFunction[]}
     */
    private readonly finalFunctions: FinalFunction<any>[] = [];


    /**
     * Serving static files
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {string} filePath
     */
    static(path: string, filePath: string) {
        this.get(path + '/*', async (req, res, next) => {
            // log('Sending file:', filePath + req.pathname.replace(path, ''), req.pathname);
            res.sendFile(filePath + req.pathname.replace(path, ''));
        });
    }



    /**
     * Adds a get middleware function to the route
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callbacks
     * @returns {App}
     */
    get(path: string | ServerFunction<null>, ...callbacks: ServerFunction<null>[]): App {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callbacks.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.GET
            })));
        } else {
            this.serverFunctions.push(...[path, ...callbacks].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.GET
            })));
        }
        return this;
    }


    /**
     * Adds a middleware function that is run for every request that matches the path
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callback
     * @returns {App}
     */
    use(path: string | ServerFunction<any>, ...callback: ServerFunction<any>[]): App {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callback.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.GET
            })));
        } else {
            this.serverFunctions.push(...[path, ...callback].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.GET
            })));
        }
        return this;
    }

    /**
     * Adds a post middleware function to the route
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {...ServerFunction[]} callback
     * @returns {App}
     */
    post<T>(path: string | ServerFunction<T>, ...callback: ServerFunction<T>[]): App {
        if (typeof path === 'string') {
            this.serverFunctions.push(...callback.map(cb => ({
                path: path,
                callback: cb,
                method: RequestMethod.POST
            } as ServerFunctionHandler<T>)));
        } else {
            this.serverFunctions.push(...[path, ...callback].map(cb => ({
                path: '/*',
                callback: cb,
                method: RequestMethod.POST
            } as ServerFunctionHandler<T>)));
        }
        return this;
    }


    /**
     * Adds a route to the application
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {Route} route
     * @returns {App}
     */
    route(path: string, route: Route): App {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        // this.routes[path] = route;
        return this;
    }


    /**
     * Adds a final function to the application
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {FinalFunction} callback
     * @returns {App}
     */
    final<T>(callback: FinalFunction<T>): App {
        this.finalFunctions.push(callback as FinalFunction<T>);
        return this;
    }
}


/**
 * Used to extract parameters from a path
 * @date 10/12/2023 - 2:49:36 PM
 */
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