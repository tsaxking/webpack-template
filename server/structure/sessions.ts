import { Request, Response, NextFunction } from 'npm:express';
import { getClientIp } from 'npm:request-ip';
import { uuid } from '../utilities/uuid.ts';
import Account from './accounts.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseCookie } from '../../shared/cookie.ts';

type CustomRequest = Request & { session: Session };



type SocketEmit = {
    event: string;
    args: any;
    room?: string;
    time: Date;
}





export class Session {
    static middleware(req: CustomRequest, res: Response, next: NextFunction) {
        const id = req.headers.cookie ? parseCookie(req.headers.cookie).ssid : null;

        if (id && Session.sessions[id]) {
            req.session = Session.sessions[id];
        } else {
            req.session = new Session(req, res);
            Session.addSession(req.session);
        }
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
            // session.account = new Account({
            //     username: 'guest',
            //     key: '',
            //     salt: '',
            //     verified: 1,
            //     // roles: JSON.stringify(['guest']),
            //     email: '',
            //     name: 'Guest',
            //     info: '{}'
            // });
        }
    }
    static removeSession(session: Session) {
        delete Session._sessions[session.id];
    }

    static saveSessions() {
        const s: {[key: string]: any} = {};
        Object.entries(Session.sessions).forEach(([id, session]) => {
            // customize what you want to save
            s[id] = {
                ip: session.ip,
                id: session.id,
                latestActivity: session.latestActivity,
                account: session.account?.username
            };
        });

        fs.writeFile(path.resolve(__dirname, './sessions.txt'), JSON.stringify(s, null, 4), err => {
            if (err) {
                console.error(err);
                console.log(Session.sessions);
            }
        });
    }

    static loadSessions() {
        if (!fs.existsSync(path.resolve(__dirname, './sessions.txt'))) return fs.writeFileSync(path.resolve(__dirname, './sessions.txt'), '{}', 'utf8');

        const s = fs.readFileSync(path.resolve(__dirname, './sessions.txt'), 'utf8');
        const sessions = JSON.parse(s) as {[key: string]: any};

        return Promise.all(Object.entries(sessions).map(async ([id, session]) => {
            Session.addSession(await Session.fromSessObj(session));
        }));
    }

    static async fromSessObj(s: any) {
        const session = new Session();
        session.ip = s.ip;
        session.id = s.id;
        session.latestActivity = s.latestActivity;
        session.account = await Account.fromUsername(s.account);
        return session;
    }

    // static addSocket(socket: Socket): boolean {
    //     const cookie = socket.handshake.headers.cookie;
    //     if (!cookie) return false;
    //     const { id } = parseCookie(cookie) as { id: string };
    //     if (!id) return false;
    //     const session = Session.sessions[id];
    //     if (!session) return false;
    //     session.setSocket(socket);
    //     return true;
    // }



    ip: string|null;
    id: string;
    latestActivity: number = Date.now();
    account: Account | null = null;
    prevUrl?: string;
    
    
    // private readonly sockets: {
    //     socket: Socket,
    //     queue: SocketEmit[]
    // }[] = [];
    // readonly socket = {
    //     emit: (event: string, ...args: any[]) => {
    //         this.sockets.forEach(s => {
    //             if (!s.socket.connected) return s.queue.push({ 
    //                 event, 
    //                 args,
    //                 time: new Date()
    //             });
                
    //             s.socket.emit(event, ...args);
    //         });
    //     },
    //     to: (room: string) => {
    //         return {
    //             emit: (event: string, ...args: any[]) => {
    //                 for (const s of this.sockets) {
    //                     if (!s.socket.rooms.has(room)) continue;
    //                     if (!s.socket.connected) {
    //                         s.queue.push({ 
    //                             event, 
    //                             args, 
    //                             room,
    //                             time: new Date()
    //                         });
    //                         continue;
    //                     }
    //                     s.socket.to(room).emit(event, ...args);
    //                 }
    //             }
    //         }
    //     }
    // }

    constructor(req?: CustomRequest, res?: Response) {
        if (req) this.ip = getClientIp(req);
        else this.ip = 'unknown';
        this.id = uuid();

        if (res) res.cookie('ssid', this.id, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
        });
    }

    // setSocket(socket: Socket) {
    //     this.sockets.push({
    //         socket,
    //         queue: []
    //     });
    // }

    // getSocket(req: Request): Socket|undefined {
    //     const cookie = req.headers.cookie;
    //     if (!cookie) throw new Error('No cookie');
    //     const socket = this.sockets.find(s => s.socket.id === req.body.socketId);
    //     // if (!socket) throw new Error('No socket');
    //     return socket?.socket;
    // }

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