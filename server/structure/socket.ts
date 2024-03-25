import { App } from './app/app';
import { EventEmitter } from '../../shared/event-emitter';
import { Server } from 'socket.io';
import { parseCookie } from '../../shared/cookie';

/**
 * Wrapper class around the socket.io server
 * @date 3/8/2024 - 6:04:16 AM
 *
 * @export
 * @class SocketWrapper
 * @typedef {SocketWrapper}
 */
export class SocketWrapper {
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
    /**
     * Creates an instance of SocketWrapper.
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @constructor
     * @param {App} app
     * @param {Server} io
     */
    constructor(
        private readonly app: App,
        private readonly io: Server
    ) {
        io.on('connection', socket => {
            console.log('connected');

            const cookie = socket.handshake.headers.cookie;
            if (cookie) {
                const { ssid } = parseCookie(cookie);

                if (ssid) {
                    socket.join(ssid);
                    SocketWrapper.sockets.set(ssid, this);
                }
            }

            socket.on('disconnect', () => {
                console.log('disconnected');
            });
        });
    }

    /**
     * Emits an event to all the sockets
     * @date 3/8/2024 - 6:04:16 AM
     *
     * @param {string} event
     * @param {?unknown} [data]
     */
    emit(event: string, data?: unknown) {
        this.io.emit(event, data);
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
        return this.io.to(room);
    }
}
