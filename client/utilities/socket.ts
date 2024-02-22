import { ServerRequest } from './requests';

class SocketWrapper {
    private io: WebSocket;

    set socket(socket: WebSocket) {
        this.io = socket;
    }

    get socket() {
        return this.io;
    }

    on(event: string, callback: (data?: any) => void) {
        this.io.addEventListener(event, callback);
    }

    off(event: string, callback: (data?: any) => void) {
        this.io.removeEventListener(event, callback);
    }

    once(event: string, callback: (data?: any) => void) {
        const cb = (data?: any) => {
            callback(data);
            this.io.removeEventListener(event, cb);
        }
        this.io.addEventListener(event, cb);
    }

    emit(event: string, data?: any) {
        this.io.send(JSON.stringify({ event, data }));
    }
}


ServerRequest.post<{
    url: string;
}>('/socket-init').then((cookie))


export const socket = new SocketWrapper();