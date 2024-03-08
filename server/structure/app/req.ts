import express from 'express';
import { App } from './app';
import { Session } from '../sessions';
import { FileUpload } from '../../middleware/stream';

/**
 * Body type
 * @date 3/8/2024 - 6:16:47 AM
 *
 * @typedef {B}
 */
type B = {
    [key: string]: unknown;
};

/**
 * Body with files
 * @date 3/8/2024 - 6:16:47 AM
 *
 * @typedef {FileBody}
 */
type FileBody = B & {
    $$files: FileUpload[];
};

/**
 * Request body
 * @date 3/8/2024 - 6:16:47 AM
 *
 * @export
 * @typedef {ReqBody}
 */
export type ReqBody = B | FileBody;

/**
 * Request class
 * @date 3/8/2024 - 6:16:47 AM
 *
 * @export
 * @class Req
 * @typedef {Req}
 * @template [T=unknown]
 */
export class Req<T = unknown> {
    /**
     * Start time
     * @date 3/8/2024 - 6:16:47 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public readonly start = Date.now();
    /**
     * Files
     * @date 3/8/2024 - 6:16:47 AM
     *
     * @private
     * @type {FileUpload[]}
     */
    private $files: FileUpload[] = [];

    /**
     * Creates an instance of Req.
     * @date 3/8/2024 - 6:16:47 AM
     *
     * @constructor
     * @param {App} app
     * @param {express.Request} req
     * @param {Session} session
     */
    constructor(
        public readonly app: App,
        public readonly req: express.Request,
        public readonly session: Session
    ) {}

    /**
     * Params of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get params() {
        return this.req.params;
    }

    /**
     * Body of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @type {T}
     */
    public get body(): T {
        return this.req.body;
    }

    /**
     * Body of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @type {T}
     */
    public set body(value: T) {
        this.req.body = value;
    }

    /**
     * URL of the request (ex: /api/v1/users/1)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get url() {
        return this.req.url;
    }

    /**
     * Headers of the request as a map
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get headers() {
        const map = new Map<string, string>();
        if (!this.req.headers) return map;
        for (const key in this.req.headers) {
            map.set(key, this.req.headers[key] as string);
        }

        return map;
    }

    /**
     * Method of the request (ex: GET, POST, PUT, DELETE)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get method() {
        return this.req.method;
    }

    /**
     * Cookies of the request as a map
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get cookie() {
        return this.req.cookies ? this.req.cookies : {};
    }

    /**
     * Query of the request as a map (ex: ?name=John&age=30)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get query() {
        return this.req.query;
    }

    /**
     * IP of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get ip() {
        return this.req.ip;
    }

    /**
     * Original URL of the request (ex: /api/v1/users/1?name=John&age=30)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get originalUrl() {
        return this.req.originalUrl;
    }

    /**
     * Path of the request (ex: /api/v1/users/1)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get pathname() {
        return this.req.path;
    }

    /**
     * Protocol of the request (ex: http, https)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get protocol() {
        return this.req.protocol;
    }

    /**
     * Is the request secure (https)
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public get secure() {
        return this.req.secure;
    }

    /**
     * Socket.io instance
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @readonly
     * @type {SocketWrapper}
     */
    public get io() {
        return this.app.io;
    }

    /**
     * Files of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @type {{}}
     */
    public get files() {
        return this.$files;
    }

    /**
     * Files of the request
     * @date 3/8/2024 - 6:16:46 AM
     *
     * @public
     * @type {{}}
     */
    public set files(files: FileUpload[]) {
        this.$files = files;
    }
}
