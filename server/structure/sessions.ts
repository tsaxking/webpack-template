// import { Request, Response, NextFunction } from 'npm:express';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import { DB } from '../utilities/databases.ts';
import { CookieOptions, Next, ServerFunction } from './app/app.ts';
import { app } from '../server.ts';
import { Req } from './app/req.ts';
import { Res } from './app/res.ts';

/**
 * Session object from the database
 * @date 10/12/2023 - 3:13:58 PM
 *
 * @export
 * @typedef {SessionObj}
 */
export type SessionObj = {
    ip: string;
    id: string;
    latestActivity: number;
    accountId: string | null;
    prevUrl?: string;
    userAgent?: string;
    created: number;
    limitTime?: number;
};

/**
 * The options for the session middleware
 * @date 10/12/2023 - 3:13:58 PM
 *
 * @typedef {SessionOptions}
 */
type SessionOptions = {
    cookie?: CookieOptions;
    request?: {
        max: number;
        per: number;
        onOverload?: (session: Session) => void;
    };
    name?: string;
};

/**
 * This session class represents a session, which is a connection from a client.
 * Use this to store account information, etc.
 * @date 10/12/2023 - 3:13:58 PM
 *
 * @export
 * @class Session
 * @typedef {Session}
 */
export class Session {
    /**
     * This is not implemented yet, but it will be for rate limiting
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @type {{
            max: number;
            per: number;
            onOverload?: (session: Session) => void;
        }}
     */
    static requestsInfo: {
        max: number;
        per: number;
        onOverload?: (session: Session) => void;
    } = {
        max: Infinity,
        per: 60 * 1000,
    };

    /**
     * The default options for the cookie, these can be changed with the middleware function
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @type {CookieOptions}
     */
    static cookieOptions: CookieOptions = {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'Strict',
    };
    /**
     * The cookie identifier for the session
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @type {string}
     */
    static sessionName = 'ssid';

    /**
     * Retrieves a session from the database
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @param {string} id
     * @returns {(Session | undefined)}
     */
    static get(id: string): Session | undefined {
        const s = DB.get('sessions/get', { id });
        return s ? Session.fromSessObj(s) : undefined;
    }

    /**
     * Converts a session object from the database to a session class
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @param {SessionObj} s
     * @returns {Session}
     */
    static fromSessObj(s: SessionObj): Session {
        const session = new Session();
        session.ip = s.ip;
        session.id = s.id;
        session.latestActivity = s.latestActivity;
        session.prevUrl = s.prevUrl;
        session.userAgent = s.userAgent;
        session.accountId = s.accountId || undefined;
        return session;
    }

    /**
     * Creates a new session and saves it to the database
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @param {Req} req
     * @param {Res} res
     * @returns {(Session|undefined)}
     */
    static newSession(req: Req, res: Res): Session | undefined {
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
            created: s.created,
        });

        return s;
    }

    /**
     * The middleware function for the session
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @static
     * @param {?SessionOptions} [options]
     * @returns {ServerFunction}
     */
    static middleware(options?: SessionOptions): ServerFunction<any> {
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
        };
    }

    /**
     * The ip address of the client
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {string}
     */
    public ip = '';
    /**
     * The id of the session
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {string}
     */
    public id: string;
    /**
     * Account id, if the user is signed in
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {?string}
     */
    public accountId?: string;
    /**
     * The time of the latest request
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {number}
     */
    public latestActivity: number = Date.now();
    /**
     * The previous url (used for redirects)
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {?string}
     */
    public prevUrl?: string;
    /**
     * Not implemented yet, but this will be used for rate limiting
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {number}
     */
    public requests = 0;
    /**
     * The time this session was created
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @type {number}
     */
    public readonly created: number = Date.now();
    /**
     * The client user agent, if available
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @type {?string}
     */
    public userAgent?: string;

    /**
     * Creates an instance of Session.
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @constructor
     * @param {?Req} [req]
     */
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

    /**
     * The account object, if the user is signed in
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @readonly
     * @type {(Account | null)}
     */
    get account(): Account | null {
        if (!this.accountId) return null;
        return Account.fromId(this.accountId);
    }

    /**
     * Sign in to an account
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @param {Account} account
     */
    signIn(account: Account) {
        this.accountId = account.id;
        this.save();
    }

    /**
     * Sign out of the account
     * @date 10/12/2023 - 3:13:57 PM
     */
    signOut() {
        this.accountId = undefined;
        this.save();
    }

    /**
     * Destroy the session
     * @date 10/12/2023 - 3:13:57 PM
     */
    destroy() {
        DB.run('sessions/delete', { id: this.id });
    }

    /**
     * Save the session to the database
     * @date 10/12/2023 - 3:13:57 PM
     */
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
                created: this.created,
            });
        }
    }

    /**
     * Emits an event to the client (using socket.io)
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @param {string} event
     * @param {...any[]} args
     */
    emit(event: string, ...args: any[]) {
        app.io.to(this.id).emit(event, ...args);
    }
}
