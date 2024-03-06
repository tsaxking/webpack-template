import { App } from './app/app';
import { EventEmitter } from '../../shared/event-emitter';
import { Server } from 'socket.io';
import { parseCookie } from '../../shared/cookie';

export class SocketWrapper {
    public static readonly sockets = new Map<string, SocketWrapper>();

    private readonly em = new EventEmitter();
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

    emit(event: string, data?: unknown) {
        this.io.emit(event, data);
    }

    on(event: string, fn: (data?: unknown) => void) {
        this.em.on(event, fn);
    }

    off(event: string, fn: (data?: unknown) => void) {
        this.em.off(event, fn);
    }

    to(room: string) {
        return this.io.to(room);
    }
}
