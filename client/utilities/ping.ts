// Purpose: Ping utility to check the latency of the server.

import { EventEmitter } from '../../shared/event-emitter';

/**
 * Ping the server to check the latency
 * @date 3/8/2024 - 7:19:40 AM
 *
 * @async
 * @returns {Promise<number>}
 */
const ping = async (): Promise<number> => {
    const start = Date.now();

    await fetch('/ping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const end = Date.now();

    return end - start;
};

/**
 * Current state of the server's ping
 * @date 3/8/2024 - 7:19:40 AM
 *
 * @export
 * @typedef {PingState}
 */
export type PingState =
    | 'disconnected'
    | 'strong'
    | 'weak'
    | 'medium'
    | 'unknown';

/**
 * Ping event data
 * @date 3/8/2024 - 7:19:40 AM
 *
 * @typedef {PingEventData}
 */
type PingEventData = {
    ping: number;
    change: PingState;
    error: Error;
};

/**
 * Ping utility
 * @date 3/8/2024 - 7:19:39 AM
 *
 * @class Ping
 * @typedef {Ping}
 */
class Ping {
    /**
     * Ping interval
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @type {number}
     */
    #interval = 1000;
    /**
     * Current state of the server's ping
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @public
     * @type {PingState}
     */
    public state: PingState = 'disconnected';
    /**
     * All pings
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @private
     * @readonly
     * @type {number[]}
     */
    private readonly pings: number[] = [];
    /**
     * Timeout for the ping
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @private
     * @type {?NodeJS.Timeout}
     */
    private timeout?: NodeJS.Timeout;
    /**
     * Event emitter for the ping
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @private
     * @readonly
     * @type {EventEmitter<keyof PingEventData>}
     */
    private readonly $emitter: EventEmitter<keyof PingEventData> =
        new EventEmitter<keyof PingEventData>();

    /**
     * Creates an instance of Ping.
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @constructor
     */
    constructor() {
        this.start();
    }

    /**
     * Start the pinger
     * @date 3/8/2024 - 7:19:39 AM
     */
    start() {
        this.timeout = setInterval(async () => {
            const currentState = this.state;
            await ping()
                .then(p => {
                    this.pings.push(p);
                    this.emit('ping', p);

                    if (p < 1000) this.state = 'strong';
                    if (p > 1000 && p < 2000) this.state = 'medium';
                    if (p > 2000) this.state = 'weak';
                })
                .catch(err => {
                    this.emit('error', err);
                    this.state = 'disconnected';
                });

            if (currentState !== this.state) this.emit('change', this.state);
        }, this.#interval);

        return this.stop;
    }

    /**
     * Stop the pinger
     * @date 3/8/2024 - 7:19:39 AM
     */
    stop() {
        if (this.timeout) clearInterval(this.timeout);
    }

    /**
     * Set the interval of the pinger
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @type {number}
     */
    set interval(i: number) {
        const running = !!this.timeout;
        this.stop();
        this.#interval = i;
        if (running) this.start();
    }

    /**
     * Get the interval of the pinger
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @type {number}
     */
    get interval() {
        return this.#interval;
    }

    /**
     * Get the average ping
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @readonly
     * @type {number}
     */
    get average() {
        return this.pings.reduce((a, b) => a + b, 0) / this.pings.length;
    }

    /**
     * Get the moving average of the pings
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @param {number} num
     * @returns {number}
     */
    movingAverage(num: number) {
        if (num > this.pings.length) return this.average;
        if (num < 1) throw new Error('Moving average must be greater than 0');
        return (
            this.pings
                .slice(this.pings.length - num)
                .reduce((a, b) => a + b, 0) / num
        );
    }

    /**
     * Add an event listener
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @template {keyof PingEventData} K
     * @param {K} event
     * @param {(data: PingEventData[K]) => void} callback
     * @returns {void) => void}
     */
    on<K extends keyof PingEventData>(
        event: K,
        callback: (data: PingEventData[K]) => void
    ) {
        this.$emitter.on(event, callback);
    }

    /**
     * Remove an event listener
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @template {keyof PingEventData} K
     * @param {K} event
     * @param {?(data: PingEventData[K]) => void} [callback]
     * @returns {void) => void}
     */
    off<K extends keyof PingEventData>(
        event: K,
        callback?: (data: PingEventData[K]) => void
    ) {
        this.$emitter.off(event, callback);
    }

    /**
     * Emit an event
     * @date 3/8/2024 - 7:19:39 AM
     *
     * @template {keyof PingEventData} K
     * @param {K} event
     * @param {PingEventData[K]} data
     */
    emit<K extends keyof PingEventData>(event: K, data: PingEventData[K]) {
        this.$emitter.emit(event, data);
    }

    /**
     * Destroy the pinger
     * @date 3/8/2024 - 7:19:39 AM
     */
    destroy() {
        this.$emitter.destroy();
        this.stop();
        this.pings.length = 0;
    }
}

export default new Ping();
