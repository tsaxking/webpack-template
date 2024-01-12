import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';
import { __root } from '../../utilities/env.ts';
import { Session } from '../sessions.ts';
import { parseCookie } from '../../../shared/cookie.ts';
import { FileUpload } from '../../middleware/stream.ts';

/**
 * File body type
 * @date 1/9/2024 - 1:15:22 PM
 *
 * @typedef {FileBody}
 */
type FileBody = {
    $$files: FileUpload[];
};

/**
 * This class represents a request
 * @date 10/12/2023 - 3:02:56 PM
 *
 * @export
 * @class Req
 * @typedef {Req}
 */
export class Req<
    T = {
        [key: string]: unknown;
    },
> {
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
    readonly url: string;
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
     * The url without the domain
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {string}
     */
    readonly pathname: string;
    /**
     * If the request has a query (?key=value), this will be a URLSearchParams object
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {URLSearchParams}
     */
    readonly query: URLSearchParams;
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
        public readonly io: Server,
    ) {
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this.pathname = new URL(req.url, 'http://localhost').pathname;
        this.query = new URL(req.url, 'http://localhost').searchParams;
        this.ip = info.remoteAddr.hostname;
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
     * The session object
     * @date 10/12/2023 - 3:02:55 PM
     *
     * @readonly
     * @type {Session}
     */
    get session(): Session {
        const s = Session.get(this.cookie.ssid);
        if (!s) throw new Error('No session found for req');
        return s;
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
