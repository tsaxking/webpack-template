import { App } from './app/app';
import { EventEmitter } from '../../shared/event-emitter';
import { Server } from 'socket.io';
import { parseCookie } from '../../shared/cookie';
import { isMainThread, workerData, Worker, parentPort } from 'worker_threads';

export class SocketWrapper {
    public static readonly sockets = new Map<string, SocketWrapper>();
    public readonly io!: Server;
    // private readonly em = new EventEmitter();

    constructor(
        private readonly app: App
    ) {
        if (isMainThread) {
            this.io = new Server(this.app.httpServer);

            this.io.on('connection', (socket) => {
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
    }

    emit(event: string, data?: unknown) {
        if (isMainThread) this.io!.emit(event, data);
        else {
            parentPort?.postMessage({
                socket: true,
                event,
                data
            });
        }
    }

    on(event: string, fn: (data?: unknown) => void) {
        console.warn('It is not recommended to use "SocketWrapper.on" as it can lead to memory leaks and is not stable in a multi-threaded environment');
        if (isMainThread) this.io!.on(event, fn);
        else {
            const listener = (msg: { socket: boolean; event: string; data: unknown }) => {
                if (msg.socket && msg.event === event) {
                    fn(msg.data);
                }
            };

            parentPort?.on('message', listener);
        }
    }

    off(event: string, fn: (data?: unknown) => void) {
        if (isMainThread) this.io!.off(event, fn);
        else {
            parentPort?.off('message', fn);
        }
    }

    to(room: string) {
        return {
            emit: (event: string, data?: unknown) => {
                if (isMainThread) this.io!.to(room).emit(event, data);
                else {
                    parentPort?.postMessage({
                        socket: true,
                        event,
                        data,
                        to: room
                    });
                }
            }
        };
    }
}
