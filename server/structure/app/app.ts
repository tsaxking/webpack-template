import express from 'express';
// import { __root } from '../../utilities/env.ts';
import { log } from '../../utilities/terminal-logging';
import { Req } from './req';
import { Res } from './res';
import { SocketWrapper } from '../socket';
import http from 'http';
import { Server } from 'socket.io';
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
export type ServerFunction<T = unknown> = (
    req: Req<T>,
    res: Res,
    next: Next
) => any | Promise<any>;
/**
 * Final function that is called at the end of a request
 * @date 10/12/2023 - 2:49:37 PM
 *
 * @export
 * @typedef {FinalFunction}
 */
export type FinalFunction<T> = (req: Req<T>, res: Res) => any;

declare module 'express-serve-static-core' {
    interface Request {
        request: Req;
        response: Res;
    }
}

export class Route {
    readonly router = express.Router();

    private addListener<T>(
        method: RequestMethod,
        path: string,
        ...fn: ServerFunction<T>[]
    ) {
        this.router[method](path, async (req: express.Request, _res, next) => {
            const { request, response } = req;

            try {
                const run = async (i: number) => {
                    if (i >= fn.length) return next();
                    await fn[i](request as Req<T>, response, () => run(i + 1));
                };

                await run(0);
            } catch (e) {
                response.sendStatus('unknown:error');
            }
        });
    }

    public get<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener(RequestMethod.GET, path, ...fn);
    }

    public post<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener(RequestMethod.POST, path, ...fn);
    }

    public put<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener(RequestMethod.PUT, path, ...fn);
    }

    public delete<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener(RequestMethod.DELETE, path, ...fn);
    }

    public use<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener(RequestMethod.USE, path, ...fn);
    }

    public route(path: string, route: Route) {
        this.router.use(path, route.router);
    }
}

export class App {
    public static headerAuth(key: string, value: string): ServerFunction {
        return (req, res, next) => {
            if (req.headers.get(key) === value) {
                next();
            } else {
                res.sendStatus('permissions:unauthorized');
            }
        };
    }

    public readonly io: SocketWrapper;
    public readonly server: express.Application;
    public readonly finalFunctions: FinalFunction<unknown>[] = [];
    public readonly httpServer: http.Server;

    constructor(
        public readonly port: number,
        public readonly domain: string
    ) {
        this.server = express();
        this.httpServer = http.createServer(this.server);
        this.io = new SocketWrapper(this, new Server(this.httpServer));

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
        this.server.use(async (req, res, next) => {
            const s = await Session.from(this, req, res);
            const request = new Req(this, req, s);
            req.request = request;
            req.response = new Res(this, res, request);
            next();
        });
    }

    private addListener<T>(
        method: RequestMethod,
        path: string,
        ...fn: ServerFunction<T>[]
    ) {
        this.server[method](path, async (req: express.Request, _res, next) => {
            const final = async () => {
                // console.log('Final');
                // if (!req.response.fulfilled) return console.log('Not fulfilled');
                for (const fn of this.finalFunctions) {
                    await fn(req.request as Req<unknown>, req.response);
                }
            };
            try {
                const run = async (i: number) => {
                    // console.log('Running:', i);
                    if (i >= fn.length) return next();
                    await fn[i](req.request as Req<T>, req.response, () =>
                        run(i + 1)
                    );
                    // console.log('Ran:', i, 'of', fn.length, 'for', path);
                };

                await run(0);
                await final();
            } catch (e) {
                req.response.sendStatus('unknown:error');
            }
        });
    }

    public get<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener<T>(RequestMethod.GET, path, ...fn);
    }

    public post<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener<T>(RequestMethod.POST, path, ...fn);
    }

    public put<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener<T>(RequestMethod.PUT, path, ...fn);
    }

    public delete<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener<T>(RequestMethod.DELETE, path, ...fn);
    }

    public use<T>(path: string, ...fn: ServerFunction<T>[]) {
        this.addListener<T>(RequestMethod.USE, path, ...fn);
    }

    public route(path: string, route: Route) {
        this.server.use(path, route.router);
    }

    public static(path: string, dirPath: string) {
        this.server.use(path, express.static(dirPath));
    }

    public final<T>(fn: FinalFunction<T>) {
        this.finalFunctions.push(fn as FinalFunction<unknown>);
    }

    public listen() {
        this.httpServer.listen(this.port, () => {
            log(`Server is listening on port ${this.port}`);
        });
    }
}
