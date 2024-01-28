/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '../../shared/socket';
import { ServerRequest } from './requests';
import { uptime } from '../../shared/clock';
import { error, log } from './logging';

/**
 * This waits for the server to send the socket url before initializing the socket, this is so that the socket url can be defined only in one location (the .env file)
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @type {*}
 */
const initialized = new Promise<void>((res) => {
    ServerRequest.post<{ url: string }>('/socket-url').then((data) => {
        if (data.isOk()) {
            const { value } = data;
            res();
            const s = io(value.url);
            s.on('disconnect', () => {
                s.io['reconnect'](); // reconnect is private, but it is still accessible if I do this
            });

            s.on('reload', () => {
                if (uptime() > 1000) location.reload();
            });

            socket.socket = s;
        } else {
            error(data.error);
        }
    });
});

/**
 * Currently unused, but this is an idea for how to handle socket event metadata
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @export
 * @typedef {SocketMetadata}
 */
export type SocketMetadata = {
    time: number;
};

/**
 * Socket listener that can have multiple view updates
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @export
 * @class SocketListener
 * @typedef {SocketListener}
 */
export class SocketListener {
    /**
     * All socket listeners
     * @date 1/22/2024 - 2:23:28 AM
     *
     * @public
     * @static
     * @readonly
     * @type {Map<string, SocketListener>}
     */
    public static readonly listeners: Map<string, SocketListener> = new Map();

    /**
     * Adds a listener to the map of listeners
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @private
     * @static
     * @param {SocketListener} listener
     * @returns {*}
     */
    private static addListener(listener: SocketListener) {
        if (SocketListener.listeners.has(listener.event)) {
            return error(
                new Error(`Event ${listener.event} already has a listener`),
            );
        } else SocketListener.listeners.set(listener.event, listener);
    }

    /**
     * List of view updates
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @type {ViewUpdate[]}
     */
    updates: ViewUpdate[] = [];

    /**
     * Creates an instance of SocketListener.
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @constructor
     * @param {string} event
     */
    constructor(public readonly event: string) {
        SocketListener.addListener(this);
    }

    /**
     * Adds a view update to the list of view updates
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @param {ViewUpdate} viewUpdate
     */
    add(viewUpdate: ViewUpdate) {
        this.updates.push(viewUpdate);
    }
}

/**
 * View update that can be filtered
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @export
 * @class ViewUpdate
 * @typedef {ViewUpdate}
 */
export class ViewUpdate {
    /**
     * Creates an instance of ViewUpdate.
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @constructor
     * @param {string} event
     * @param {(string|null)} page
     * @param {(...args: any[]) => void} callback
     * @param {?(...args: any[]) => boolean} [filter]
     */
    constructor(
        public readonly event: string,
        public readonly page: string | null,
        public readonly callback: (...args: unknown[]) => void,
        public readonly filter?: (...args: unknown[]) => boolean,
    ) {
        const listener = SocketWrapper.listeners[event];
        if (!listener) throw new Error(`Event ${event} does not exist`);

        listener.add(this);
    }

    /**
     * Destroys the view update
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @returns {*}
     */
    destroy() {
        const listener = SocketWrapper.listeners[this.event];
        if (!listener) {
            return error(`Event ${this.event} does not exist`);
        }

        const index = listener.updates.indexOf(this);
        if (index === -1) {
            return error(`ViewUpdate ${this.event} does not exist`);
        }

        listener.updates.splice(index, 1);
    }
}

/**
 * This is a wrapper around the socket, this is to typesafe socket events and eventually the socket callback parameters
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @export
 * @class SocketWrapper
 * @typedef {SocketWrapper}
 */
export class SocketWrapper {
    /**
     * List of socket listeners
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @static
     * @type {{
            [key: string]: SocketListener;
        }}
     */
    static listeners: {
        [key: string]: SocketListener;
    } = {};

    /**
     * Socket.io client server
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @private
     * @type {?*}
     */
    private $$socket?: Socket;

    /**
     * Creates an instance of SocketWrapper.
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @constructor
     */
    constructor() {}

    /**
     * This is a getter for the socket
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @type {*}
     */
    get socket() {
        return this.$$socket;
    }

    /**
     * This is a setter for the socket so that it can be initialized after the class is created
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @type {*}
     */
    set socket(socket: Socket | undefined) {
        if (this.$$socket) throw new Error('Socket is already initialized');
        this.$$socket = socket;

        if (socket) {
            ServerRequest.post<{
                ssid: string;
            }>('/socket-init').then((res) => {
                if (res.isOk()) {
                    socket.emit('ssid', res.value.ssid);
                }
            });
        }
    }

    /**
     * Global socket.io object
     * @date 1/22/2024 - 2:23:28 AM
     *
     * @readonly
     * @type {*}
     */
    get io() {
        return this.$$socket?.io;
    }

    /**
     * If the socket is connected
     * @date 1/22/2024 - 2:23:28 AM
     *
     * @readonly
     * @type {*}
     */
    get connected() {
        return this.$$socket?.connected;
    }

    // wrapper for socket so that it can update the model and view if on the correct page with a single listener
    /**
     * adds an event listener to the socket
     * @date 10/12/2023 - 1:28:35 PM
     *
     * @async
     * @param {SocketEvent} event
     * @param {(...args: any[]) => void} dataUpdate
     * @returns {Promise<SocketListener>}
     */
    async on(
        event: SocketEvent,
        dataUpdate: (...args: any[]) => void,
    ): Promise<SocketListener> {
        // wait for the socket to be initialized, if it already has been initialized then this will resolve immediately
        await initialized;

        if (SocketWrapper.listeners[event]) {
            error(`Event ${event} already has a listener`);
            return SocketWrapper.listeners[event];
        }
        const listener = new SocketListener(event);
        SocketWrapper.listeners[event] = listener;

        this.$$socket?.on(
            event,
            (/* metadata: SocketMetadata, */ ...args: any[]) => {
                log('socket.on', event, ...args);
                dataUpdate(...args);

                for (const vu of listener.updates) {
                    // filter is a custom function that returns true if the view should update based on the data received
                    if (vu.filter && !vu.filter(...args)) {
                        log('filtering out', vu);
                        continue;
                    }
                    vu.callback(...args);
                }
            },
        );

        return listener;
    }
}

/**
 * This is the socket wrapper that is used to interact with the socket
 * @date 10/12/2023 - 1:28:35 PM
 *
 * @type {SocketWrapper}
 */
export const socket = new SocketWrapper();
