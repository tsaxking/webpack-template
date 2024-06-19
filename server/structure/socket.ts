import { App } from './app/app';
import { EventEmitter } from '../../shared/event-emitter';
import { Server } from 'socket.io';
import { parseCookie } from '../../shared/cookie';
import { validate } from '../middleware/data-type';
import { uuid } from '../utilities/uuid';

type Cache = {
    event: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    room?: string;
    id: number;
};

class SocketSession {
    public rooms: string[] = [];

    constructor(
        public readonly id: string,
        private readonly socket: SocketWrapper
    ) {}

    join(room: string) {
        this.rooms.push(room);
        this.socket.to(room).emit('join', this.id);
    }

    leave(room: string) {
        this.rooms = this.rooms.filter(r => r !== room);
        this.socket.to(room).emit('leave', this.id);
    }

    emit(event: string, data?: unknown) {
        this.socket.to(this.id).emit(event, data);
    }
}
let num = 0;
/**
 * Wrapper class around the socket.io server
 * @date 3/8/2024 - 6:04:16 AM
 *
 * @export
 * @class SocketWrapper
 * @typedef {SocketWrapper}
 */
export class SocketWrapper {
    public static Socket = SocketSession;

    /**
     * A map of all the sockets
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @public
     * @static
     * @readonly
     * @type {*}
     */
    public static readonly sockets = new Map<string, SocketWrapper>();

    /**
     * Event emitter for the socket
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly em = new EventEmitter();

    public cache: Cache[] = [];

    public sessions = new Map<string, SocketSession>();

    /**
     * Creates an instance of SocketWrapper.
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @constructor
     * @param {App} app
     * @param {Server} io
     */
    constructor(
        private readonly app: App
        // private readonly io: Server
    ) {
        // io.on('connection', socket => {
        //     console.log('connected');

        //     const cookie = socket.handshake.headers.cookie;
        //     if (cookie) {
        //         const { ssid } = parseCookie(cookie);

        //         if (ssid) {
        //             socket.join(ssid);
        //             SocketWrapper.sockets.set(ssid, this);
        //         }
        //     }

        //     socket.on('disconnect', () => {
        //         console.log('disconnected');
        //     });
        // });

        this.app.post<{
            cache: {
                event: string;
                data: unknown;
            }[];
            id: string | undefined;
        }>(
            '/socket',
            // validate({
            //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
            //     cache: (v: unknown) => Array.isArray(v) && v.every((c: any) => typeof c.event === 'string' && typeof c.data === 'object'),
            //     id: ['string', 'undefined']
            // }),
            (req, res) => {
                const { cache } = req.body;
                let { id } = req.body;
                if (!id) id = uuid();
                let s = this.sessions.get(id);
                if (!s) {
                    s = new SocketSession(id, this);
                    this.sessions.set(id, s);

                    this.em.emit('connect', s);
                }

                for (const c of cache) this.em.emit(c.event, c.data);

                res.json({
                    cache: this.cache.map(c => ({
                        event: c.event,
                        data: c.data,
                        id: c.id
                    })),
                    id
                });
            }
        );
    }

    /**
     * Emits an event to all the sockets
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @param {string} event
     * @param {?unknown} [data]
     */
    emit(event: string, data?: unknown) {
        num++;
        const c = {
            event,
            data,
            id: num
        };
        this.cache.push(c);
        setTimeout(
            () => {
                this.cache = this.cache.filter(
                    (cc, i, a) => a.indexOf(cc) !== i
                );
            },
            5 * 1000 * 60
        );

        // this.io.emit(event, data);
    }

    /**
     * Listens for an event
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @param {string} event
     * @param {(data?: unknown) => void} fn
     * @returns {void) => void}
     */
    on(event: string, fn: (data?: unknown) => void) {
        this.em.on(event, fn);
    }

    /**
     * Stops listening for an event
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @param {string} event
     * @param {(data?: unknown) => void} fn
     * @returns {void) => void}
     */
    off(event: string, fn: (data?: unknown) => void) {
        this.em.off(event, fn);
    }

    /**
     * Emits an event to a specific room
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @param {string} room
     * @returns {*}
     */
    to(room: string) {
        return {
            emit: (event: string, data?: unknown) => {
                num++;
                this.cache.push({ event, data, room, id: num });
            }
        };

        // return this.io.to(room);
    }
}
