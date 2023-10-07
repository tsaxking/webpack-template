// import { Request, Response, NextFunction } from 'npm:express';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import { DB } from "../utilities/databases.ts";
import { Next, ServerFunction, CookieOptions } from "./app/app.ts";
import { app } from "../server.ts";
import { Req } from "./app/req.ts";
import { Res } from "./app/res.ts";


export type SessionObj = {
    ip: string;
    id: string;
    latestActivity: number;
    accountId: string|null;
    prevUrl?: string;
    userAgent?: string;
    created: number;
    limitTime?: number;
}

type SessionOptions = {
    cookie?: CookieOptions;
    request?: {
        max: number;
        per: number;
        onOverload?: (session: Session) => void;
    };
    name?: string;
}


export class Session {
    static requestsInfo: {
        max: number;
        per: number;
        onOverload?: (session: Session) => void;
    } = {
        max: Infinity,
        per: 60 * 1000
    };

    static cookieOptions: CookieOptions = {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'Strict'
    };
    static sessionName: string = 'ssid';

    static get(id: string): Session | undefined {
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

    static newSession(req: Req, res: Res): Session|undefined {
        const s = new Session(req);
        res.cookie(Session.sessionName, s.id, Session.cookieOptions);
        req.addCookie('ssid', s.id);

        DB.run('sessions/new', {
            id: s.id,
            ip: s.ip || '',
            latestActivity: s.latestActivity,
            accountId: s.accountId || '',
            userAgent: s.userAgent || '',
            prevUrl: s.prevUrl || '',
            requests: s.requests,
            created: s.created
        });

        return s;
    }


    static middleware(options?: SessionOptions): ServerFunction {
        if (options) {
            if (options.request) {
                Session.requestsInfo = options.request;
            }
            if (options.cookie) {
                Session.cookieOptions = options.cookie;
            }
            if (options.name) {
                Session.sessionName = options.name;
            }
        }

        return (req: Req, res: Res, next: Next) => {
            const s = req.session;
            s.requests++;
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

    constructor(req?: Req) {
        this.id = (uuid() + uuid() + uuid() + uuid()).replace(/-/g, '');

        if (req) {
            this.ip = req.ip;
            this.userAgent = req.headers.get('user-agent') || '';
        }

        // if (Session.requestsInfo.max < Infinity) {
            // log(Session.requestsInfo.max, Session.requestsInfo.per);
            // setInterval(() => {
            //     this.requests = 0;
            // }, Session.requestsInfo.per);
        // }
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

        const s = DB.get('sessions/get', { id: this.id });

        if (s) {
            DB.run('sessions/update', {
                id: this.id,
                ip: this.ip || '',
                latestActivity: this.latestActivity,
                accountId: this.accountId || '',
                userAgent: this.userAgent || '',
                prevUrl: this.prevUrl || '',
                requests: this.requests,
                created: this.created
            });
        } else {
            DB.run('sessions/new', {
                id: this.id,
                ip: this.ip || '',
                latestActivity: this.latestActivity,
                accountId: this.accountId || '',
                userAgent: this.userAgent || '',
                prevUrl: this.prevUrl || '',
                requests: this.requests,
                created: this.created
            });
        }
    }

    emit(event: string, ...args: any[]) {
        app.io.to(this.id).emit(event, ...args);
    }
}