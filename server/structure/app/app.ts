/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
// make a class that simulates npm:express using the deno std library
import { __root } from '../../utilities/env.ts';
import { error } from '../../utilities/terminal-logging.ts';
import { Session } from '../sessions.ts';
import { Req } from './req.ts';
import { Res } from './res.ts';
import { ReqBody } from './req.ts';
import { io, SocketWrapper } from '../socket.ts';
import { Application, Context, Router } from 'https://deno.land/x/oak/mod.ts';
// import { OakSession } from 'https://deno.land/x/sessions/mod.ts';

/**
 * All file types that can be sent (can be expanded)
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {FileType}
 */
export type FileType =
    | 'js'
    | 'css'
    | 'html'
    | 'json'
    | 'png'
    | 'jpg'
    | 'jpeg'
    | 'gif'
    | 'svg'
    | 'ico'
    | 'ttf'
    | 'woff'
    | 'woff2'
    | 'otf'
    | 'eot'
    | 'mp4'
    | 'webm'
    | 'mp3'
    | 'wav'
    | 'ogg'
    | 'txt'
    | 'pdf'
    | 'zip'
    | 'rar'
    | 'tar'
    | '7z'
    | 'xml'
    | 'doc'
    | 'docx'
    | 'xls'
    | 'xlsx'
    | 'ppt'
    | 'pptx'
    | 'avi'
    | 'wmv'
    | 'mov'
    | 'mpeg'
    | 'flv';

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
    error,
    alreadyFulfilled,
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
};

/**
 * This class is used to group requests together from a single pathname
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @class Route
 * @typedef {Route}
 */
export class Route {
    public readonly router = new Router();

    constructor() {}

    /**
     * These are all of the final functions that are grouped together (run at the end of the request)
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {FinalFunction[]}
     */
    public readonly finalFunctions: FinalFunction<unknown>[] = [];

    get(path: string | ServerFunction, ...callbacks: ServerFunction[]): this {
        this.parse(
            RequestMethod.GET,
            path,
            ...callbacks,
        );
        return this;
    }

    post<T>(
        path: string | ServerFunction<T>,
        ...callbacks: ServerFunction<T>[]
    ): this {
        this.parse(
            RequestMethod.POST,
            path,
            ...callbacks,
        );
        return this;
    }

    use(path: string | ServerFunction, ...callbacks: ServerFunction[]): this {
        this.parse(
            RequestMethod.USE,
            path,
            ...callbacks,
        );
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
        this.router.use(path, route.router.routes());
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
        return this;
    }

    
    public parse<T>(
        type: RequestMethod,
        path: string | ServerFunction<T>,
        ...callbacks: ServerFunction<T>[]
    ) {

        const parse = (cb: ServerFunction<T>): any => {
            return async (ctx: Context, next: () => Promise<void>) => {
                const req = ctx.state.req as Req<T>;
                const res = ctx.state.res as Res;
                try {
                    await cb(req, res, next);
                } catch (e) {
                    error('Error handling request:', e);
                    if (!res.fulfilled) {
                        res.sendStatus('server:unknown-server-error');
                    }
                }
            };
        };

        if (typeof path === 'string') {
            this.router.use(
                path,
                parse(callbacks[0]),
                ...callbacks.slice(1).map(parse),
            );
        } else {
            this.router.use(
                parse(path),
                parse(callbacks[0]),
                ...callbacks.slice(1).map(parse),
            )
        }

        // switch (type) {
        //     case RequestMethod.GET:
        //         if (typeof path === 'string') {
        //             return this.router.get(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.get(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.POST:
        //         if (typeof path === 'string') {
        //             return this.router.post(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.post(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.PUT:
        //         if (typeof path === 'string') {
        //             return this.router.put(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.put(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.DELETE:
        //         if (typeof path === 'string') {
        //             return this.router.delete(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.delete(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.USE:
        //         if (typeof path === 'string') {
        //             return this.router.use(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.use(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        // }
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
    DELETE = 'DELETE',
    USE = 'USE',
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
export type ServerFunction<T = unknown> = (
    req: Req<T>,
    res: Res,
    next: Next,
) => any | Promise<any>;
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
type ServerFunctionHandler<T = ReqBody> = {
    path: string;
    callback: ServerFunction<T>;
    method: RequestMethod;
};

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
    blockedIps?: string[];
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
     * Creates a middleware function that checks if the request has a header with the specified key and value
     *
     * @public
     * @static
     * @param {string} key
     * @param {string} value
     * @returns {ServerFunction}
     */
    public static headerAuth(key: string, value: string): ServerFunction {
        return (req, res, next) => {
            if (req.headers.get(key) === value) {
                next();
            } else {
                res.sendStatus('permissions:unauthorized');
            }
        };
    }

    /**
     * Socket.io server
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {Server}
     */
    public readonly io: SocketWrapper;
    /**
     * Deno server
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @public
     * @readonly
     * @type {Deno.Server}
     */
    public readonly server = new Application();

    public readonly router = new Router();

    /**
     * Creates an instance of App.
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @constructor
     * @param {number} port
     * @param {string} domain
     * @param {?AppOptions} [options]
     */
    constructor(
        public readonly port: number,
        public readonly domain: string,
        options?: AppOptions,
    ) {
        // this.io = new SocketWrapper(options?.ioPort || 443);
        this.io = io;

        this.router.use(async (ctx, next) => {
            // this is not wrapped in a try catch, because if it fails, that means nothing should work

            const req = new Req(ctx, this.io);
            const res = new Res(this, req);

            // 2 things need to be handled:
            // ssid in the cookie may not be valid or exist
            // the session on the server may not exist

            let ssid = await ctx.cookies.get('session');
            let s: Session;

            if (ssid) {
                const _s = await Session.get(ssid);
                if (_s) {
                    s = _s;
                } else {
                    s = new Session(req);
                    res.cookie('session', s.id);
                    ssid = s.id;
                }
            } else {
                s = new Session(req);
                res.cookie('session', s.id);
                ssid = s.id;
            }

            req.session = s;

            // for the next middleware functions
            ctx.state.req = req;
            ctx.state.res = res;

            req.body = await req.ctx.request.body.json();

            next();
        });

        if (options) {
            // if (options.onListen) {
            //     options.onListen();
            // }

            if (options.onConnection) {
                this.io.on('connection', options.onConnection);
            }

            if (options.onDisconnect) {
                this.io.on('disconnect', options.onDisconnect);
            }

            if (options.blockedIps) this.blockedIps = options.blockedIps;
        }
    }

    private readonly blockedIps: string[] = [];

    /**
     * Serving static files
     * @date 10/12/2023 - 2:49:37 PM
     *
     * @param {string} path
     * @param {string} filePath
     */
    static(path: string, filePath: string) {
        this.get(path + '/*', async (req, res) => {
            // log('Sending file:', filePath + req.pathname.replace(path, ''), req.pathname);
            res.sendFile(filePath + req.pathname.replace(path, ''));
        });
    }

    get(path: string | ServerFunction, ...callbacks: ServerFunction[]): this {
        this.parse(
            RequestMethod.GET,
            path,
            ...callbacks,
        );
        return this;
    }

    post<T>(
        path: string | ServerFunction<T>,
        ...callbacks: ServerFunction<T>[]
    ): this {
        this.parse(
            RequestMethod.POST,
            path,
            ...callbacks,
        );
        return this;
    }

    use(path: string | ServerFunction, ...callbacks: ServerFunction[]): this {
        this.parse(
            RequestMethod.USE,
            path,
            ...callbacks,
        );
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
        console.error('Not implemented');
        return this;
    }

    public parse<T>(
        type: RequestMethod,
        path: string | ServerFunction<T>,
        ...callbacks: ServerFunction<T>[]
    ) {
        console.log('Adding', type, path, callbacks);

        const parse = (cb: ServerFunction<T>): any => {
            return async (ctx: Context, next: () => Promise<void>) => {
                const req = ctx.state.req as Req<T>;
                const res = ctx.state.res as Res;
                try {
                    await cb(req, res, next);
                } catch (e) {
                    error('Error handling request:', e);
                    if (!res.fulfilled) {
                        res.sendStatus('server:unknown-server-error');
                    }
                }
            };
        };

        if (typeof path === 'string') {
            this.router.use(
                path,
                parse(callbacks[0]),
                ...callbacks.slice(1).map(parse),
            );
        } else {
            this.router.use(
                parse(path),
                parse(callbacks[0]),
                ...callbacks.slice(1).map(parse),
            )
        }

        // switch (type) {
        //     case RequestMethod.GET:
        //         if (typeof path === 'string') {
        //             return this.router.get(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.get(
        //                 '',
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.POST:
        //         if (typeof path === 'string') {
        //             return this.router.post(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.post(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.PUT:
        //         if (typeof path === 'string') {
        //             return this.router.put(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.put(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.DELETE:
        //         if (typeof path === 'string') {
        //             return this.router.delete(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.delete(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        //     case RequestMethod.USE:
        //         if (typeof path === 'string') {
        //             return this.router.use(
        //                 path,
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             );
        //         } else {
        //             return this.router.use(
        //                 parse(path),
        //                 parse(callbacks[0]),
        //                 ...callbacks.slice(1).map(parse),
        //             )
        //         }
        // }
    }

    listen(cb?: () => void) {
        this.server.use(this.router.routes());
        this.server.use(this.router.allowedMethods());
        this.server.listen({ port: this.port });
        console.log(`Listening on port ${this.port}...`);
        cb?.();
    }

    route(path: string, route: Route): this {
        this.router.use(path, route.router.routes());
        return this;
    }
}

/**
 * Used to extract parameters from a path
 * @date 10/12/2023 - 2:49:36 PM
 */
const extractParams = (
    path: string,
    url: string,
): {
    [key: string]: string;
} => {
    const params: {
        [key: string]: string;
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
