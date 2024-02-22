import { ServerRequest } from './requests';

type Listener = {
    event: string;
    callback: (data?: unknown) => void;
    protocol: 'on' | 'off' | 'once';
} | {
    event: string;
    data?: unknown;
    protocol: 'emit'
}

class SocketWrapper {
    private io: WebSocket;

    private cache: Listener[] = [];

    set socket(socket: WebSocket) {
        this.io = socket;
        for (const c of this.cache) {
            switch (c.protocol) {
                case 'on':
                    this.io.addEventListener(c.event, c.callback);
                    break;
                case 'off':
                    this.io.removeEventListener(c.event, c.callback);
                    break;
                case 'once':
                    (() => {
                        const cb = (data?: unknown) => {
                            c.callback(data);
                            this.io.removeEventListener(c.event, cb);
                        }
                        this.io.addEventListener(c.event, cb);
                    })();
                    break;
                case 'emit':
                    this.io.send(JSON.stringify({ event: c.event, data: c.data }));
                    break;
            }
        }

        this.cache = [];
    }

    get socket() {
        return this.io;
    }

    on(event: string, callback: (data?: unknown) => void) {
        if (!this.io) {
            return this.cache.push({ event, callback, protocol: 'on' });
        }
        this.io.addEventListener(event, callback);
    }

    off(event: string, callback: (data?: unknown) => void) {
        if (!this.io) {
            return this.cache.push({ event, callback, protocol: 'off' });
        }
        this.io.removeEventListener(event, callback);
    }

    once(event: string, callback: (data?: unknown) => void) {
        const cb = (data?: unknown) => {
            callback(data);
            this.io.removeEventListener(event, cb);
        }
        if (!this.io) {
            return this.cache.push({ event, callback: cb, protocol: 'once' });
        }
        this.io.addEventListener(event, cb);
    }

    emit(event: string, data?: unknown) {
        if (!this.io) {
            return this.cache.push({ event, data, protocol: 'emit' });
        }
        this.io.send(JSON.stringify({ event, data }));
    }
}





export const socket = new SocketWrapper();

ServerRequest.post<{
    url: string;
}>('/socket-url').then((cookie) => {
    if (cookie.isOk()) {
        socket.socket = new WebSocket(cookie.value.url, [
            'wss'
        ]);
    }
});