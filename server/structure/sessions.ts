// import { Request, Response, NextFunction } from 'npm:express';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import { parseCookie } from '../../shared/cookie.ts';
import { DB } from "../utilities/databases.ts";
import { Req, Res, Next, ServerFunction, CookieOptions } from "./app.ts";


export type SessionObj = {
    ip: string;
    id: string;
    latestActivity: number;
    accountId: string|null;
    prevUrl?: string;
    userAgent?: string;
    created: number;
}


export class Session {
    private static requestsPerMinute?: number;
    private static onOverload?: (session: Session) => void;

    static get(cookie: string): Session | undefined {
        const id = parseCookie(cookie).ssid;
        const s = DB.get('sessions/get', { id });
        return s ? Session.fromSessObj(s) : undefined;
    }


    static fromSessObj(s: SessionObj) {
        const session = new Session();
        session.ip = s.ip;
        session.id = s.id;
        session.latestActivity = s.latestActivity;
        session.prevUrl = s.prevUrl;
        session.userAgent = s.userAgent;
        return session;
    }

    static newSession(req: Req, res: Res, options?: CookieOptions): Session {
        const s = new Session(req);
        res.cookie('ssid', s.id, options);
        return s;
    }


    static middleware(options?: {
        cookie: CookieOptions;
        requests?: {
            perMinute: number;
            onOverload: (session: Session) => void;
        }
    }): ServerFunction {
        let rpm = Infinity;
        if (options?.requests) {
            Session.requestsPerMinute = options.requests.perMinute;
            rpm = options.requests.perMinute;
            Session.onOverload = options.requests.onOverload;
        }
        return (req: Req, res: Res, next: Next) => {
            const cookie = req.headers.get('cookie');
            let s: Session;

            if (!cookie) {
                s = Session.newSession(req, res, options?.cookie);
            } else {
                s = Session.get(cookie) || Session.newSession(req, res, options?.cookie);
            }

            req.session = s;
            s.requests++;

            if (s.requests > rpm) Session.onOverload?.(s);
            s.latestActivity = Date.now();
            next();
        }
    }

    ip = '';
    id: string;
    accountId?: string;
    latestActivity: number = Date.now();
    prevUrl?: string;
    requests = 0;
    created: number = Date.now();
    userAgent?: string;
    limitTime?: number;

    constructor(req?: Req) {
        this.id = (uuid() + uuid() + uuid() + uuid()).replace(/-/g, '');

        if (req) {
            this.ip = req.ip;
            this.userAgent = req.headers.get('user-agent') || '';
            // this.prevUrl = req.headers.get('referer') || '';
        }

        if (Session.onOverload && Session.requestsPerMinute) {
            setInterval(() => {
                this.requests = 0;
            }, 1000 * 60);
        }
    }

    get account(): Account | null {
        if (!this.accountId) return null;
        return Account.fromId(this.accountId);
    }

    signIn(account: Account) {
        this.accountId = account.id;
        this.save();
    }

    signOut() {
        this.accountId = undefined;
        this.save();
    }

    destroy() {
        DB.run('sessions/delete', { id: this.id });
    }

    save() {
        this.account?.save();

        DB.run('sessions/update', {
            id: this.id,
            ip: this.ip || '',
            latestActivity: this.latestActivity,
            accountId: this.account?.id || '',
            userAgent: this.userAgent || '',
            prevUrl: this.prevUrl || '',
            requests: this.requests,
            created: this.created
        });
    }

    limit(time: number) {

    }

    block() {

    }
}