/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from '../../shared/event-emitter';
// import { io } from 'socket.io-client';
import { ServerRequest } from './requests';
import { sleep } from '../../shared/sleep';
import { alert } from './notifications';
import { attemptAsync } from '../../shared/check';

type SocketOptions = {
    type: 'adaptive' | 'constant';
    interval: number;
    timeLimit?: number;
};

type Cache = {
    event: string;
    data: any;
};

const SOCKET_INTERVAL = 250;
let latest = 0;

/**
 * Wrapper for the socket.io client
 * @date 3/8/2024 - 7:27:46 AM
 *
 * @class SocketWrapper
 * @typedef {Socket}
 */
class Socket {
    private cache: Cache[] = [];
    private id?: string;
    public isActive = false;

    public options: SocketOptions = {
        type: 'adaptive',
        interval: 1000,
        timeLimit: 1000 * 60 * 5 // 5 minutes
    };

    private readonly em = new EventEmitter();

    /**
     * Socket.io client
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
    // private readonly socket = io();

    private async ping() {
        return attemptAsync(async () => {
            // if (!SocketWrapper.isActive) return;
            const res = await ServerRequest.post<{
                cache: {
                    event: string;
                    data: any;
                    id: number;
                }[];
                id: string;
            }>(
                '/socket',
                {
                    cache: this.cache,
                    id: this.id
                },
                {
                    cached: false
                }
            );

            if (res.isOk()) {
                this.id = res.value.id;
                for (const c of res.value.cache.sort((a, b) => a.id - b.id)) {
                    if (c.id > latest) {
                        this.newEvent(c.event, c.data);
                        latest = c.id;
                    }
                }
                this.cache = [];
            } else {
                console.error(res.error);
            }
        });
    }

    /**
     * Adds a listener for the event
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @param {string} event
     * @param {(data: any) => void} callback
     * @returns {void) => void}
     */
    on(event: string, callback: (data: any) => void) {
        this.em.on(event, callback);
        // this.socket.on(event, callback);
    }

    /**
     * Removes a listener for the event
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @param {string} event
     * @param {(data: any) => void} callback
     * @returns {void) => void}
     */
    off(event: string, callback: (data: any) => void) {
        this.em.off(event, callback);
        // this.socket.off(event, callback);
    }

    private newEvent(event: string, data: any) {
        // console.log({ event, data });
        this.em.emit(event, data);
    }

    /**
     * Connect to the server
     * @date 3/8/2024 - 7:27:46 AM
     */
    connect() {
        let running = false;
        let timeout: number = this.options.interval;
        let sessionTimeout: NodeJS.Timeout;
        let isOffline = false;
        const run = async () => {
            if (isOffline) return (running = false);
            running = true;
            await sleep(timeout);
            await this.ping();
            if (this.options.type === 'adaptive') timeout += SOCKET_INTERVAL;
            run();
        };
        const on = document.addEventListener;
        const off = document.removeEventListener;

        const reset = () => {
            timeout = SOCKET_INTERVAL;
            if (sessionTimeout) clearTimeout(sessionTimeout);
            if (this.options.timeLimit)
                sessionTimeout = setTimeout(() => {
                    isOffline = true;
                    off('visibilitychange', reset);
                    off('focus', reset);
                    off('blur', () => (timeout = 0));
                    off('scroll', reset);
                    off('mousemove', reset);
                    off('keydown', reset);
                    off('keyup', reset);
                    off('click', reset);
                    off('touchstart', reset);
                    off('touchend', reset);
                    off('touchmove', reset);
                    off('touchcancel', reset);
                    off('touchleave', reset);
                    alert('Session expired, please refresh the page.')
                        .then(() => location.reload())
                        .catch(() => location.reload());
                }, this.options.timeLimit); // 5 minutes
            if (!running) run();
        };
        reset();
        on('visibilitychange', reset);
        on('focus', reset);
        on('blur', () => (timeout = 0));
        on('scroll', reset);
        on('mousemove', reset);
        on('keydown', reset);
        on('keyup', reset);
        on('click', reset);
        on('touchstart', reset);
        on('touchend', reset);
        on('touchmove', reset);
        on('touchcancel', reset);
        on('touchleave', reset);

        // this.socket.connect();

        // this.socket.on('disconnect', () => {
        //     this.socket.io.connect();
        // });
    }

    /**
     * Emit an event
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @param {string} event
     * @param {*} data
     */
    emit(event: string, data: any) {
        this.cache.push({ event, data });
        this.newEvent(event, data);
        // this.socket.emit(event, data);
    }
}

/**
 * Socket.io client
 * @date 3/8/2024 - 7:27:46 AM
 *
 * @type {Socket}
 */
export const socket = new Socket();

Object.assign(window, { socket });

let changed = false;

// Yes, this has side effects. But this is used to control the socket connection.
/**
 * Builds the socket connection, can only be called once. Must be called for the socket to work.
 * // TODO: this likely isn't great, so I'll need to revisit this
 * @date 3/8/2024 - 7:27:46 AM
 *
 * @param {SocketOptions} options
 */
export const buildSocket = ({ type, interval, timeLimit }: SocketOptions) => {
    if (changed) throw new Error('Socket already built');
    socket.options = { type, interval, timeLimit };
    socket.connect();
    changed = true;
};
