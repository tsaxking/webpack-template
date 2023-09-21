import io from '../../node_modules/socket.io/client-dist/socket.io.js';
import { Page } from '../views/page.ts';
import { SocketEvent } from "../../shared/socket.ts";

const __socket = io();

__socket.on('disconnect', () => {
    socket.io.reconnect();
});

export type SocketMetadata = {
    time: number;
};

export class ViewUpdateWrapper {
    public readonly args: any[];
    
    constructor(public readonly viewUpdate: ViewUpdate, ...args: any[]) {
        this.args = args;
    }
}


export class SocketListener {
    public static readonly listeners: {
        [key: string]: SocketListener;
    } = {};

    private static addListener(listener: SocketListener) {
        if (SocketListener.listeners[listener.event]) 
            return console.error(
                new Error(`Event ${listener.event} already has a listener`));
    }



    updates: ViewUpdate[] = [];

    constructor(public readonly event: string) {
        SocketListener.addListener(this);
    }

    add(viewUpdate: ViewUpdate) {
        this.updates.push(viewUpdate);
    }
}

export class ViewUpdate {
    static updates: ViewUpdateWrapper[] = [];

    constructor(
        public readonly event: string,
        public readonly page: string|null,
        public readonly callback: (...args: any[]) => void,
        public readonly filter?: (...args: any[]) => boolean
    ) {
        const listener = SocketWrapper.listeners[event];
        if (!listener) throw new Error(`Event ${event} does not exist`);

        listener.add(this);
    }

    destroy() {
        const listener = SocketWrapper.listeners[this.event];
        if (!listener) return console.error(`Event ${this.event} does not exist`);

        const index = listener.updates.indexOf(this);
        if (index === -1) return console.error(`ViewUpdate ${this.event} does not exist`);

        listener.updates.splice(index, 1);
    }
}

export class SocketWrapper {
    static listeners: {
        [key: string]: SocketListener;
    } = {};



    constructor(private readonly socket: any) {}

    get io() {
        return this.socket.io;
    }


    // wrapper for socket so that it can update the model and view if on the correct page with a single listener
    on(event: SocketEvent, dataUpdate: (...args: any[]) => void): SocketListener {
        if (SocketWrapper.listeners[event]) {
            console.error(`Event ${event} already has a listener`);
            return SocketWrapper.listeners[event];
        }
        const listener = new SocketListener(event);
        SocketWrapper.listeners[event] = listener;

        this.socket.on(event, (/* metadata: SocketMetadata, */ ...args: any[]) => {
            console.log('socket.on', event, ...args);
            dataUpdate(...args);

            for (const vu of listener.updates) {
                // filter is a custom function that returns true if the view should update based on the data received
                if (vu.filter && !vu.filter(...args)) {
                    console.log('filtering out', vu);
                    continue;
                }
                if (!vu.page) {
                    vu.callback(...args);
                    continue;
                }
                if (Page.current?.name === vu.page) {
                    vu.callback(...args);
                } else {
                    ViewUpdate.updates.push(
                        new ViewUpdateWrapper(vu, ...args)
                    );
                }
            }
        });

        return listener;
    }
}

export const socket = new SocketWrapper(__socket);

// const socket = io();
socket.on('disconnect', () => {
    socket.io.reconnect();
});