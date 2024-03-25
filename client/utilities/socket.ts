/* eslint-disable @typescript-eslint/no-explicit-any */
// import { EventEmitter } from '../../shared/event-emitter';
import { io } from 'socket.io-client';

// type Cache = {
//     event: string;
//     data: any;
// };

// const SOCKET_INTERVAL = 1500;

/**
 * Wrapper for the socket.io client
 * @date 3/8/2024 - 7:27:46 AM
 *
 * @class SocketWrapper
 * @typedef {SocketWrapper}
 */
class SocketWrapper {
    // private cache: Cache[] = [];
    // private id?: string;
    // public static isActive = false;

    // private readonly em = new EventEmitter();

    /**
     * Socket.io client
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
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

    /**
     * Adds a listener for the event
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @param {string} event
     * @param {(data: any) => void} callback
     * @returns {void) => void}
     */
    on(event: string, callback: (data: any) => void) {
        // this.em.on(event, callback);
        this.socket.on(event, callback);
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
        // this.em.off(event, callback);
        this.socket.off(event, callback);
    }

    // private newEvent(event: string, data: any) {
    //     console.log({ event, data });
    //     // this.em.emit(event, data);

    // }

    /**
     * Connect to the server
     * @date 3/8/2024 - 7:27:46 AM
     */
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

    /**
     * Emit an event
     * @date 3/8/2024 - 7:27:46 AM
     *
     * @param {string} event
     * @param {*} data
     */
    emit(event: string, data: any) {
        // this.cache.push({ event, data });
        // this.newEvent(event, data);
        this.socket.emit(event, data);
    }
}

/**
 * Socket.io client
 * @date 3/8/2024 - 7:27:46 AM
 *
 * @type {SocketWrapper}
 */
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
