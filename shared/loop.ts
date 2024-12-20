import { EventEmitter } from './event-emitter';
import { sleep } from './sleep';

type LoopEvents = {
    stop: void;
    start: void;
};

export class Loop<
    Events extends Record<string, unknown> = Record<string, unknown>
> extends EventEmitter<LoopEvents & Omit<Events, 'stop' | 'start'>> {
    private _running = false;
    public stop = () => {
        this._running = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit('stop', undefined as any);
    };

    get active() {
        return this._running;
    }

    constructor(
        public readonly fn: (tick: number) => void,
        public interval: number
    ) {
        super();
    }

    public start() {
        if (this._running) return this.stop;
        this._running = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit('start', undefined as any);

        const globalStart = Date.now();
        let i = 0;

        const loop = async () => {
            if (!this._running) return;
            this.fn(i);
            i++;
            await sleep(
                this.interval - ((Date.now() - globalStart) % this.interval)
            );
            loop();
        };

        loop();
    }
}
