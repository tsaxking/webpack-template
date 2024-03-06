/* eslint-disable @typescript-eslint/no-explicit-any */
// import { EventEmitter } from '../../shared/event-emitter';
import { io } from 'socket.io-client';

// type Cache = {
//     event: string;
//     data: any;
// };

// const SOCKET_INTERVAL = 1500;

class SocketWrapper {
    // private cache: Cache[] = [];
    // private id?: string;
    // public static isActive = false;

    // private readonly em = new EventEmitter();

    private readonly socket = io();

    // private async ping() {
    //     if (!SocketWrapper.isActive) return;
    //     const res = await ServerRequest.post<{
    //         cache: Cache[];
    //         id: string;
    //     }>('/socket', {
    //         cache: this.cache,
    //         id: this.id
    //     });

    //     if (res.isOk()) {
    //         this.id = res.value.id;
    //         for (const c of res.value.cache) this.newEvent(c.event, c.data);
    //         this.cache = [];
    //     } else {
    //         console.error(res.error);
    //     }
    // }

    // private interval = setInterval(() => this.ping(), SOCKET_INTERVAL);

    on(event: string, callback: (data: any) => void) {
        // this.em.on(event, callback);
        this.socket.on(event, callback);
    }

    off(event: string, callback: (data: any) => void) {
        // this.em.off(event, callback);
        this.socket.off(event, callback);
    }

    // private newEvent(event: string, data: any) {
    //     console.log({ event, data });
    //     // this.em.emit(event, data);

    // }

    connect() {
        // clearInterval(this.interval);
        // this.interval = setInterval(() => {
        //     this.ping();
        // }, SOCKET_INTERVAL);
        this.socket.connect();

        this.socket.on('disconnect', () => {
            this.socket.io.connect();
        });
    }

    emit(event: string, data: any) {
        // this.cache.push({ event, data });
        // this.newEvent(event, data);
        this.socket.emit(event, data);
    }
}

export const socket = new SocketWrapper();

Object.assign(window, { socket });

// {
// let timeout: NodeJS.Timeout;
// const setActivity = () => {
//     SocketWrapper.isActive = true;
//     clearTimeout(timeout);

//     // stop after 1 minute of inactivity
//     timeout = setTimeout(() => {
//         SocketWrapper.isActive = false;
//     }, 1000 * 60);
// };
// window.addEventListener('focus', setActivity);
// document.addEventListener('click', setActivity);
// document.addEventListener('mousemove', setActivity);
// document.addEventListener('keydown', setActivity);
// document.addEventListener('scroll', setActivity);
// document.addEventListener('touchstart', setActivity);
// document.addEventListener('touchmove', setActivity);
// document.addEventListener('touchend', setActivity);
// document.addEventListener('touchcancel', setActivity);
// }
