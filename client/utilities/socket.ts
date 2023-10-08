import { io } from "socket.io-client";
import { SocketEvent } from "../../shared/socket";
import { ServerRequest } from './requests';
import { uptime } from "./clock";
import { Socket } from "socket.io";


const initialized = new Promise<void>((res) => {
    ServerRequest.post<{ url: string }>('/socket-url').then(({ url }) => {
        res();
        const s = io(url);
        s.on('disconnect', () => {
            // this says it doesn't exist but it does, so I have a small work around :)
            (s.io as any).reconnect();
        });
    
        s.on('reload', () => {
            if (uptime() > 1000) location.reload();
        });
    
        socket.io = s;
    });
});



export type SocketMetadata = {
    time: number;
};

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

    private socket?: any

    constructor() {}

    get io() {
        return this.socket?.io;
    }


    set io(socket: any) {
        if (this.socket) throw new Error('Socket is already initialized');
        this.socket = socket;
    }


    // wrapper for socket so that it can update the model and view if on the correct page with a single listener
    async on(event: SocketEvent, dataUpdate: (...args: any[]) => void): Promise<SocketListener> {
        await initialized;

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
                vu.callback(...args);
            }
        });

        return listener;
    }
}

export const socket = new SocketWrapper();