import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { __root } from "../../utilities/env.ts";
import { Session } from "../sessions.ts";
import { parseCookie } from "../../../shared/cookie.ts";
import { FileUpload } from "../../middleware/stream.ts";

export class Req {
    private _cookie?: {
        [key: string]: string
    };

    public params: Record<string, string> = {};
    body: any;
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;
    readonly pathname: string;
    readonly query: URLSearchParams;
    readonly ip: string = 'localhost';
    readonly start: number = Date.now();

    constructor(public readonly req: Request, info: Deno.ServeHandlerInfo, public readonly io: Server) {
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this.pathname = new URL(req.url, 'http://localhost').pathname;
        this.query = new URL(req.url, 'http://localhost').searchParams;
        this.ip = info.remoteAddr.hostname;
    }

    get cookie(): {
        [key: string]: string
    } {
        if (this._cookie) return this._cookie;

        const c = parseCookie(this.headers.get('cookie') || '');
        this._cookie = c;
        return c;
    }


    addCookie(name: string, value: string) {
        this._cookie = {
            ...this.cookie,
            [name]: value
        };
    }



    get session(): Session {
        const s = Session.get(this.cookie.ssid);
        if (!s) throw new Error('No session found for req');
        return s;
    }

    get files(): FileUpload[] {
        if (!this.body.$$files) this.body.$$files = [];
        return this.body.$$files;
    }
};