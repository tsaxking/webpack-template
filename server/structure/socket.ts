// currently the socket wrapper class is unused, but it may be used in the future

import { Server, Socket } from "npm:socket.io";
import { parseCookie } from "../../shared/cookie.ts";
import { log } from '../utilities/terminal-logging.ts';

/**
 * Information about the socket request. This may be used in the future
 * @deprecated
 * @date 1/9/2024 - 12:44:19 PM
 *
 * @typedef {SocketMetadata}
 */
type SocketMetadata = {
    time: number;
}

/**
 * queue information for the socket
 * @date 1/9/2024 - 12:44:19 PM
 *
 * @typedef {SocketQueue}
 */
type SocketQueue = { 
    event: string, 
    args: any[], 
    room?: string, 
    metadata: SocketMetadata 
}

/**
 * Wrapper for the socket
 * @deprecated
 * @date 1/9/2024 - 12:44:19 PM
 *
 * @export
 * @class SocketWrapper
 * @typedef {SocketWrapper}
 */
export class SocketWrapper {
    /**
     * object of all sockets
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @static
     * @type {{
     *         [key: string]: SocketWrapper
     *     }}
     */
    static readonly sockets: {
        [key: string]: SocketWrapper
    } = {};


    /**
     * Queue of events to emit
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @type {SocketQueue[]}
     */
    public readonly queue: SocketQueue[] = [];
    /**
     * Number of tries to connect
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @type {number}
     */
    public numTries = 0;

    /**
     * Creates an instance of SocketWrapper.
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @constructor
     * @param {Socket} socket
     */
    constructor(private readonly socket: Socket) {
        // get cookie from socket
        const { cookie } = socket.handshake.headers;
        const { tab } = parseCookie(cookie || '');
        if (!tab) return;

        if (SocketWrapper.sockets[tab]) {
            const { queue } = SocketWrapper.sockets[tab];
            for (const q of queue) {
                if (q.room) {
                    socket.to(q.room).emit(q.event, q.metadata, ...q.args);
                } else {
                    socket.emit(q.event, q.metadata, ...q.args);
                }
            }

            SocketWrapper.sockets[tab].socket.disconnect();
        }

        SocketWrapper.sockets[tab] = this;
    }

    /**
     * Emits an event to every client
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @param {string} event
     * @param {...any[]} args
     * @returns {*}
     */
    emit(event: string, ...args: any[]) {
        log('Emitting', event, 'with', args);
        if (!this.socket.connected) return this.queue.push({
            event,
            args,
            metadata: {
                time: Date.now()
            }
        });

        this.socket.emit(event, 
            // socket metadata:
            // {
            //     time: Date.now()
            // }, 
        ...args);
    }

    /**
     * Emits an event to a specific client
     * @date 1/9/2024 - 12:44:19 PM
     *
     * @param {string} room
     * @returns {{ emit: (event: string, ...args: {}) => any; }}
     */
    to(room: string) {
        return {
            emit: (event: string, ...args: any[]) => {
                // add to queue if not connected
                if (!this.socket.connected) return this.queue.push({
                    event,
                    args,
                    room,
                    metadata: {
                        time: Date.now()
                    }
                });

                this.socket.to(room).emit(event, {
                    time: Date.now()
                }, ...args);
            }
        }
    }
}


/**
 * io server
 * @date 1/9/2024 - 12:44:19 PM
 *
 * @type {(Server|null)}
 */
export let io: Server|null = null;

/**
 * Initializes the socket server
 * @date 1/9/2024 - 12:44:18 PM
 */
export const initSocket = (server: Server) => {
    io = server;
    io.on('connection', (socket) => {
        console.log('a user connected');
        // Session.addSocket(socket);
    });
};