/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServerRequest } from './requests';
import { EventEmitter } from '../../shared/event-emitter';

type Cache = {
    event: string;
    data: any;
};

const SOCKET_INTERVAL = 1500;

class SocketWrapper {
    private cache: Cache[] = [];
    private id?: string;

    private readonly em = new EventEmitter();

    private async ping() {
        const res = await ServerRequest.post<{
            cache: Cache[];
            id: string;
        }>('/socket', {
            cache: this.cache,
            id: this.id,
        });

        if (res.isOk()) {
            this.id = res.value.id;
            for (const c of res.value.cache) this.newEvent(c.event, c.data);
            this.cache = [];
        } else {
            console.error(res.error);
        }
    }

    private interval = setInterval(() => this.ping(), SOCKET_INTERVAL);

    on(event: string, callback: (data: any) => void) {
        this.em.on(event, callback);
    }

    off(event: string, callback: (data: any) => void) {
        this.em.off(event, callback);
    }

    private newEvent(event: string, data: any) {
        this.em.emit(event, data);
    }

    connect() {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.ping();
        }, SOCKET_INTERVAL);
    }

    emit(event: string, data: any) {
        this.cache.push({ event, data });
    }
}

export const socket = new SocketWrapper();

Object.assign(window, { socket });
