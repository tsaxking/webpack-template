import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';
import { __root } from '../../utilities/env.ts';
import { Session } from '../sessions.ts';
import { parseCookie } from '../../../shared/cookie.ts';
import { FileUpload } from '../../middleware/stream.ts';
import { SocketWrapper } from '../socket.ts';
import { Context } from 'https://deno.land/x/oak@v14.0.0/mod.ts';

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
    private $session?: Session;

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
        public readonly ctx: Context,
        public readonly io: SocketWrapper,
    ) {
        this.url = new URL(ctx.request.url);
        this.method = ctx.request.method;
        this.headers = ctx.request.headers;
        this.ip = ctx.request.ip;
    }

    public get session() {
        return this.$session as Session;
    }

    public set session(s: Session) {
        this.$session = s;
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
