// import { Request, Response, NextFunction } from 'npm:express';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import { DB } from '../utilities/databases.ts';
import { CookieOptions, Next, ServerFunction } from './app/app.ts';
import { app } from '../server.ts';
import { Req } from './app/req.ts';
import { Res } from './app/res.ts';
import { error, log } from '../utilities/terminal-logging.ts';
import { Colors } from '../utilities/colors.ts';

/**
 * Session object from the database
 * @date 10/12/2023 - 3:13:58 PM
 *
 * @export
 * @typedef {SessionObj}
 */
export type SessionObj = {
    ip?: string;
    id: string;
    latestActivity?: number;
    accountId?: string;
    prevUrl?: string;
    userAgent?: string;
    created: number;
    limitTime?: number;
    requests: number;
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
    private static readonly cache = new Map<string, Session>();

    static newId() {
        return (uuid() + uuid() + uuid() + uuid()).replace(/-/g, '');
    }

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
    } = {
        max: 500,
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
    static async get(id: string): Promise<Session | undefined> {
        // if (Session.cache.has(id)) {
        //     return Session.cache.get(id);
        // }
        const res = await DB.get('sessions/get', { id });
        if (res.isOk() && res.value) {
            return Session.fromSessObj(res.value);
        }

        if (res.isErr()) {
            error(res.error);
        }

        log('No session found :(');
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
        // log('Building from:', s);

        const session = new Session();
        session.ip = s.ip;
        session.id = s.id;
        session.latestActivity = s.latestActivity;
        session.$prevUrl = s.prevUrl;
        session.userAgent = s.userAgent;
        session.accountId = s.accountId;
        session.created = s.created;
        session.requests = s.requests;

        // log('Built:', session);
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
     * The ip address of the client
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {string}
     */
    public ip: string | undefined = '';
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
    private $latestActivity: number | undefined = Date.now();
    /**
     * The previous url (used for redirects)
     * @date 10/12/2023 - 3:13:58 PM
     *
     * @type {?string}
     */
    private $prevUrl: string | undefined;
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
    public created: number = Date.now();
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
        this.id = Session.newId();

        if (req) {
            this.ip = req.ip;
            this.userAgent = req.headers.get('user-agent') || '';
        }

        // Session.cache.set(this.id, this);

        setTimeout(() => this.destroy(), Session.cookieOptions.maxAge);

        if (Session.requestsInfo.max < Infinity) {
            // log(Session.requestsInfo.max, Session.requestsInfo.per);
            setInterval(() => {
                // console.log('Resetting requests');
                this.requests = 0;
                this.save();
            }, Session.requestsInfo.per);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private timeout?: any;

    public get latestActivity(): number | undefined {
        return this.$latestActivity;
    }

    public set latestActivity(time: number | undefined) {
        this.$latestActivity = time;
        // this.save();
        if (this.timeout) clearTimeout(this.timeout);

        this.timeout = setTimeout(
            () => {
                this.requests = 0;
                this.save();
                // Session.cache.delete(this.id);
            },
            1000 * 60 * 5,
        );
    }

    async newRequest() {
        this.requests = this.requests + 1;
        // await this.save();
        // console.log('Requests:', this.requests);
        this.latestActivity = Date.now();

        if (this.requests > Session.requestsInfo.max) {
            this.blacklist('Rate limited');
        }
    }

    get prevUrl(): string | undefined {
        return this.$prevUrl;
    }

    set prevUrl(url: string | undefined) {
        this.$prevUrl = url;
        this.save();
    }

    // for caching
    private $account?: Account;

    async isBlacklisted(): Promise<boolean> {
        if (this.ip) {
            const res = await DB.get('blacklist/from-ip', { ip: this.ip });
            if (res.isOk() && res.value) return true;
        }

        if (this.accountId) {
            const res = await DB.get('blacklist/from-account', {
                accountId: this.accountId,
            });
            if (res.isOk() && res.value) return true;
        }

        return false;
    }

    async blacklist(reason: string) {
        this.requests = 0; // for when/if the blacklist is removed
        await this.save();
        DB.run('blacklist/new', {
            id: uuid(),
            ip: this.ip || '',
            reason,
            accountId: this.accountId,
            created: Date.now(),
        });
    }

    /**
     * The account object, if the user is signed in
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @readonly
     * @type {(Account | null)}
     */
    async getAccount(): Promise<Account | undefined> {
        if (this.$account) return this.$account;
        if (!this.accountId) return;
        const a = await Account.fromId(this.accountId);
        this.$account = a;
        return a;
    }

    /**
     * Sign in to an account
     * @date 10/12/2023 - 3:13:57 PM
     *
     * @param {Account} account
     */
    async signIn(account: Account) {
        this.accountId = account.id;
        this.$account = account;
        const res = await this.save();
        if (res.isErr()) error(res.error);
        return res;
    }

    /**
     * Sign out of the account
     * @date 10/12/2023 - 3:13:57 PM
     */
    async signOut() {
        this.accountId = undefined;
        this.$account = undefined;
        const res = await this.save();
        if (res.isErr()) error(res.error);
        return res;
    }

    /**
     * Destroy the session
     * @date 10/12/2023 - 3:13:57 PM
     */
    destroy() {
        return DB.run('sessions/delete', { id: this.id });
    }

    /**
     * Save the session to the database
     * @date 10/12/2023 - 3:13:57 PM
     */
    async save() {
        const s = await DB.get('sessions/get', { id: this.id });

        if (s.isOk() && s.value) {
            // console.log(Colors.FgRed, '!!!Updating session!!!', Colors.Reset);
            return DB.run('sessions/update', {
                id: this.id,
                ip: this.ip || '',
                latestActivity: this.latestActivity,
                accountId: this.accountId || '',
                userAgent: this.userAgent || '',
                prevUrl: this.prevUrl || '',
                requests: this.requests,
            });
        } else {
            return DB.run('sessions/new', {
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
    emit(event: string, args: unknown) {
        app.io.to(this.id).emit(event, args);
    }
}
