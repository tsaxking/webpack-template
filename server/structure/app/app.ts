import express from 'express';
// import { __root } from '../../utilities/env.ts';
import { log } from '../../utilities/terminal-logging';
import { Req } from './req';
import { Res } from './res';
import { SocketWrapper } from '../socket';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { Session } from '../sessions';
import session from 'express-session';

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
};

/**
 * All of the request methods that are supported
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @enum {number}
 */
enum RequestMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
    USE = 'use'
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
export type ServerFunction<T = unknown, S = unknown> = (
    req: Req<T, S>,
    res: Res,
    next: Next
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any | Promise<any>;
/**
 * Final function that is called at the end of a request
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {FinalFunction}
 */
export type FinalFunction<T, S> = (req: Req<T, S>, res: Res) => any;

declare module 'express-serve-static-core' {
    interface Request {
        request: Req;
        response: Res;
    }
}

/**
 * Route class that is used to create sub-routes
 * @date 3/8/2024 - 6:13:51 AM
 *
 * @export
 * @class Route
 * @typedef {Route}
 */
export class Route<sessionInfo = unknown> {
    /**
     * Express router
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @readonly
     * @type {*}
     */
    readonly router = express.Router();

    /**
     * Adds a listener to the router
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @private
     * @template T
     * @param {RequestMethod} method
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    private addListener<T>(
        method: RequestMethod,
        path: string,
        ...fn: ServerFunction<T, sessionInfo>[]
    ) {
        this.router[method](path, async (req: express.Request, _res, next) => {
            const { request, response } = req;

            try {
                const run = async (i: number) => {
                    if (i >= fn.length) return next();
                    await fn[i](request as Req<T, sessionInfo>, response, () =>
                        run(i + 1)
                    );
                };

                await run(0);
            } catch (e) {
                console.error(e);
                response.sendStatus('unknown:error');
            }
        });
    }

    /**
     * Listens for a GET request
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public get<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener(RequestMethod.GET, path, ...fn);
    }

    /**
     * Listens for a POST request
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public post<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener(RequestMethod.POST, path, ...fn);
    }

    /**
     * Listens for a PUT request
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public put<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener(RequestMethod.PUT, path, ...fn);
    }

    /**
     * Listens for a DELETE request
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public delete<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener(RequestMethod.DELETE, path, ...fn);
    }

    /**
     * Listens for all requests that match the path
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public use<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener(RequestMethod.USE, path, ...fn);
    }

    /**
     * Adds a route to the router
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @param {string} path
     * @param {Route} route
     */
    public route(path: string, route: Route<sessionInfo>) {
        this.router.use(path, route.router);
    }
}

/**
 * App class that is used to create a server
 * @date 3/8/2024 - 6:13:51 AM
 *
 * @export
 * @class App
 * @typedef {App}
 */
export class App<sessionInfo = unknown> {
    public static readonly SocketServer = SocketWrapper;

    /**
     * Creates a header authorization function
     * @date 3/8/2024 - 6:13:51 AM
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
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @readonly
     * @type {SocketWrapper}
     */
    public readonly io: SocketWrapper;
    /**
     * Express server
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @readonly
     * @type {express.Application}
     */
    public readonly server: express.Application;
    /**
     * Final functions that are called at the end of a request
     * @date 3/8/2024 - 6:13:51 AM
     *
     * @public
     * @readonly
     * @type {FinalFunction<unknown>[]}
     */
    public readonly finalFunctions: FinalFunction<unknown, sessionInfo>[] = [];
    /**
     * HTTP server
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @readonly
     * @type {http.Server}
     */
    public readonly httpServer: http.Server;

    /**
     * Creates an instance of App.
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @constructor
     * @param {number} port
     * @param {string} domain
     */
    constructor(
        public readonly port: number,
        public readonly domain: string
    ) {
        this.server = express();
        this.httpServer = http.createServer(this.server);

        // s.listen(port, () => {
        //     log(`Server is listening on port ${port}`);
        // });

        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: true }));

        // this.server.use(
        //     session({
        //         secret: 'hello darkness my old friend',
        //         resave: false,
        //         saveUninitialized: true,
        //         cookie: {
        //             secure: true,
        //             maxAge: 1000 * 60 * 60 * 24 * 365
        //         },
        //         name: Session.sessionName
        //     })
        // );

        this.io = new SocketWrapper(
            this as App<unknown>,
            new Server(this.httpServer, {
                connectionStateRecovery: {
                    maxDisconnectionDuration: 1000 * 60 * 5
                }
            })
        );

        this.server.use(async (req, res, next) => {
            const socketId = req.headers['socket-id'] as string | undefined;
            const socket = this.io.io.sockets.sockets.get(socketId || '');

            const s = await Session.from<sessionInfo>(
                this as App<unknown>,
                req,
                res
            );
            const request = new Req<unknown, sessionInfo>(
                this as App<unknown>,
                req,
                s,
                socket
            );
            req.request = request;
            req.response = new Res(this as App<unknown>, res, request);
            next();
        });
    }

    /**
     * Adds a listener to the server
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @private
     * @template T
     * @param {RequestMethod} method
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    private addListener<T>(
        method: RequestMethod,
        path: string,
        ...fn: ServerFunction<T, sessionInfo>[]
    ) {
        this.server[method](path, async (req: express.Request, _res, next) => {
            const final = async () => {
                // console.log('Final');
                if (!req.response.fulfilled)
                    return console.log('Not fulfilled');
                for (const fn of this.finalFunctions) {
                    try {
                        await fn(
                            req.request as Req<unknown, sessionInfo>,
                            req.response
                        );
                    } catch (error) {
                        console.error(error);
                    }
                }
            };
            try {
                const run = async (i: number) => {
                    // console.log('Running:', i);
                    if (i >= fn.length) return next();
                    await fn[i](
                        req.request as Req<T, sessionInfo>,
                        req.response,
                        () => run(i + 1)
                    );
                    // console.log('Ran:', i, 'of', fn.length, 'for', path);
                };

                await run(0);
                await final();
            } catch (e) {
                console.error(e);
                req.response.sendStatus('unknown:error');
            }
        });
    }

    /**
     * Listens for a GET request
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public get<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener<T>(RequestMethod.GET, path, ...fn);
    }

    /**
     * Listens for a POST request
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public post<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener<T>(RequestMethod.POST, path, ...fn);
    }

    /**
     * Listens for a PUT request
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public put<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener<T>(RequestMethod.PUT, path, ...fn);
    }

    /**
     * Listens for a DELETE request
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public delete<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener<T>(RequestMethod.DELETE, path, ...fn);
    }

    /**
     * Listens for all requests that match the path
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {string} path
     * @param {...ServerFunction<T>[]} fn
     */
    public use<T>(path: string, ...fn: ServerFunction<T, sessionInfo>[]) {
        this.addListener<T>(RequestMethod.USE, path, ...fn);
    }

    /**
     * Adds a route to the server
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @param {string} path
     * @param {Route} route
     */
    public route(path: string, route: Route<sessionInfo> | Route<unknown>) {
        this.server.use(path, route.router);
    }

    /**
     * Adds a static path to the server, used for serving js, css, and other files to the client
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @param {string} path
     * @param {string} dirPath
     */
    public static(path: string, dirPath: string) {
        this.server.use(path, express.static(dirPath));
    }

    /**
     * Adds a final function to the server
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     * @template T
     * @param {FinalFunction<T>} fn
     */
    public final<T>(fn: FinalFunction<T, sessionInfo>) {
        this.finalFunctions.push(fn as FinalFunction<unknown, sessionInfo>);
    }

    /**
     * Starts the server
     * @date 3/8/2024 - 6:13:50 AM
     *
     * @public
     */
    public start() {
        this.httpServer.listen(this.port, () => {
            log(`Server is listening on port ${this.port}`);
        });
    }
}
