import { Request, Response, NextFunction } from 'npm:express';
import { getClientIp } from 'npm:request-ip';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import { parseCookie } from '../../shared/cookie.ts';
import env from "../utilities/env.ts";
import { DB } from "../utilities/databases.ts";
type CustomRequest = Request & {
    session: Session;
}


export type SessionObj = {
    ip: string|null;
    id: string;
    latestActivity: number;
    accountId: string|null;
    prevUrl?: string;
    userAgent?: string;
    created: number;
}


export class Session {
    static test(req: Request, res: Response, next: NextFunction) {
        next();
    }


    static middleware(req: CustomRequest, res: Response, next: NextFunction) {
        // const id = req.headers.cookie ? parseCookie(req.headers.cookie).ssid : null;

        // if (id && Session.sessions[id]) {
        //     req.session = Session.sessions[id];
        // } else {
        //     req.session = new Session(req, res);
        //     Session.addSession(req.session);
        // }

        // req.session.requests++;
        next();
    }

    static _sessions: { [key: string]: Session } = {};
    static get sessions() {
        return Session._sessions;
    }



    static addSession(session: Session) {
        Session._sessions[session.id] = session;
        if (!session.account) {
            session.signOut();
        }
    }



    static removeSession(session: Session) {
        delete Session._sessions[session.id];
        DB.run('sessions/delete', {
            id: session.id
        });
    }

    static saveSessions() {
        for (const s of Object.values(Session.sessions)) {
            console.log('Saving session', s);
            DB.run('sessions/update', {
                id: s.id,
                ip: s.ip || '',
                latestActivity: s.latestActivity,
                accountId: s.account?.id || '',
                userAgent: s.userAgent || '',
                created: s.created,
                requests: s.requests
            });
        }
    }

    static loadSessions() {
        const sessions = DB.all('sessions/all');

        for (const s of sessions) {
            Session._sessions[s.id] = Session.fromSessObj(s);
        }
    }

    static fromSessObj(s: SessionObj) {
        const session = new Session();
        session.ip = s.ip;
        session.id = s.id;
        session.latestActivity = s.latestActivity;
        session.prevUrl = s.prevUrl;
        session.userAgent = s.userAgent;
        if (s.accountId) session.account = Account.fromId(s.accountId);
        return session;
    }



    ip: string|null;
    id: string;
    latestActivity: number = Date.now();
    account: Account | null = null;
    prevUrl?: string;
    requests: number = 0;
    created: number = Date.now();
    userAgent?: string;

    constructor(req?: CustomRequest, res?: Response) {
        if (req) this.ip = getClientIp(req);
        else this.ip = 'unknown';
        this.id = uuid();

        this.userAgent = req?.headers['user-agent'];

        if (res) res.cookie('ssid', this.id, {
            httpOnly: true,
            maxAge: env.SESSION_DURATION ? +env.SESSION_DURATION : 1000 * 60 * 60 * 24 * 7 // 1 week
        });



        DB.run('sessions/new', {
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




    signIn(account: Account) {
        this.account = account;
    }

    signOut() {
        this.account = null;
    }

    destroy() {
        Session.removeSession(this);
    }
}

Session.loadSessions();

setInterval(Session.saveSessions, 1000 * 10); // save sessions every 10 seconds