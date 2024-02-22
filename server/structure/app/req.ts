import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';
import { __root } from '../../utilities/env.ts';
import { Session } from '../sessions.ts';
import { parseCookie } from '../../../shared/cookie.ts';
import { FileUpload } from '../../middleware/stream.ts';
import { SocketWrapper } from '../socket.ts';

type B = {
    [key: string]: unknown;
};

type FileBody = B & {
    $$files: FileUpload[];
};

export type ReqBody = B | FileBody;

/**
 * This class represents a request
 * @date 10/12/2023 - 3:02:56 PM
 *
 * @export
 * @class Req
 * @typedef {Req}
 */
export class Req<T = unknown> {
    /**
     * The cookie object
     * @date 10/12/2023 - 3:02:56 PM
     *
     * @private
     * @type {?{
            [key: string]: string
        }}
     */
    private _cookie?: {
        [key: string]: string;
    };

    /**
     * All parameters as a Record<string, string>
     * @date 10/12/2023 - 3:02:56 PM
     *
     * @public
     * @type {Record<string, string>}
     */
    public params: {
        [key: string]: string | undefined;
    } = {};
    /**
     * The body of the request
     * @date 10/12/2023 - 3:02:56 PM
     *
     * @type {*}
     */
    public body: T = {} as T;
    /**
     * The url of the request (this includes the domain)
     * @date 10/12/2023 - 3:02:56 PM
     *
     * @readonly
     * @type {string}
     */
    readonly url: URL;
    /**
     * The method of the request (GET, POST, PUT, DELETE, etc.)
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {string}
     */
    readonly method: string;
    /**
     * The headers as a Headers object from Deno
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {Headers}
     */
    readonly headers: Headers;
    /**
     * The ip of the request
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {string}
     */
    readonly ip: string = 'localhost';
    /**
     * The approximate time the request was received
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {number}
     */
    readonly start: number = Date.now();

    /**
     * Creates an instance of Req.
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @constructor
     * @param {Request} req
     * @param {Deno.ServeHandlerInfo} info
     * @param {Server} io
     */
    constructor(
        public readonly req: Request,
        info: Deno.ServeHandlerInfo,
        public readonly io: SocketWrapper,
        public readonly session: Session,
    ) {
        this.url = new URL(
            req.url.startsWith('http') ? req.url : `http://${req.url}`,
        );
        this.method = req.method;
        this.headers = req.headers;
        this.ip = info.remoteAddr.hostname;
    }

    public get pathname() {
        return this.url.pathname;
    }

    public get query() {
        return this.url.search;
    }

    /**
     * The cookie object
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {{
            [key: string]: string
        }}
     */
    get cookie(): {
        [key: string]: string;
    } {
        if (this._cookie) return this._cookie;

        const c = parseCookie(this.headers.get('cookie') || '');
        this._cookie = c;
        return c;
    }

    /**
     * Sets a cookie for the response
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @param {string} name
     * @param {string} value
     */
    addCookie(name: string, value: string) {
        this._cookie = {
            ...this.cookie,
            [name]: value,
        };
    }

    /**
     * The files object (only available if used with the stream middleware)
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {FileUpload[]}
     */
    get files(): FileUpload[] {
        if (!(this.body as FileBody).$$files) {
            (this.body as FileBody).$$files = [];
        }
        return (this.body as FileBody).$$files;
    }
}
