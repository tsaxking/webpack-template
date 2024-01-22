import { EventEmitter } from '../../shared/event-emitter';

const ping = async (): Promise<number> => {
    const start = Date.now();

    await fetch('/ping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const end = Date.now();

    return end - start;
};

export type PingState =
    | 'disconnected'
    | 'strong'
    | 'weak'
    | 'medium'
    | 'unknown';

type PingEventData = {
    ping: number;
    change: PingState;
    error: Error;
};

class Ping {
    #interval = 1000;
    public state: PingState = 'disconnected';
    private readonly $pings: number[] = [];
    private timeout?: NodeJS.Timeout;
    private readonly $emitter: EventEmitter<keyof PingEventData> =
        new EventEmitter<keyof PingEventData>();

    constructor() {
        this.start();
    }

    start() {
        this.timeout = setInterval(async () => {
            const currentState = this.state;
            await ping()
                .then((p) => {
                    this.$pings.push(p);
                    this.emit('ping', p);

                    if (p < 1000) this.state = 'strong';
                    if (p > 1000 && p < 2000) this.state = 'medium';
                    if (p > 2000) this.state = 'weak';
                })
                .catch((err) => {
                    this.emit('error', err);
                    this.state = 'disconnected';
                });

            if (currentState !== this.state) this.emit('change', this.state);
        }, this.#interval);
    }

    stop() {
        if (this.timeout) clearInterval(this.timeout);
    }

    set interval(i: number) {
        this.stop();
        this.#interval = i;
        this.start();
    }

    get interval() {
        return this.#interval;
    }

    get average() {
        return this.$pings.reduce((a, b) => a + b, 0) / this.$pings.length;
    }

    movingAverage(num: number) {
        if (num > this.$pings.length) return this.average;
        if (num < 1) throw new Error('Moving average must be greater than 0');
        return (
            this.$pings
                .slice(this.$pings.length - num)
                .reduce((a, b) => a + b, 0) / num
        );
    }

    on<K extends keyof PingEventData>(
        event: K,
        callback: (data: PingEventData[K]) => void,
    ) {
        this.$emitter.on(event, callback);
    }

    off<K extends keyof PingEventData>(
        event: K,
        callback?: (data: PingEventData[K]) => void,
    ) {
        this.$emitter.off(event, callback);
    }

    emit<K extends keyof PingEventData>(event: K, data: PingEventData[K]) {
        this.$emitter.emit(event, data);
    }

    destroy() {
        this.$emitter.destroy();
        this.stop();
        this.$pings.length = 0;
    }
}

export default new Ping();
