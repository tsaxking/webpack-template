type ListenerCallback = (...args: any[]) => void;


export class EventEmitter<allowedEvents = (string | number)> {
    constructor() {}

    public readonly events: { [key: string]: ListenerCallback[] } = {};



    on(event: allowedEvents, callback: ListenerCallback) {
        if (typeof event !== 'string' && typeof event !== 'number') throw new Error('Event must be a string');
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);
    }


    emit(event: allowedEvents, ...args: unknown[]) {
        if (typeof event !== 'string' && typeof event !== 'number') throw new Error('Event must be a string');
        if (!this.events[event]) {
            return;
        }

        this.events[event].forEach(callback => {
            callback(...args);
        });
    }


    off(event: allowedEvents, callback?: ListenerCallback) {
        if (typeof event !== 'string' && typeof event !== 'number') throw new Error('Event must be a string');
        if (!this.events[event]) {
            return;
        }

        if (callback) {
            const index = this.events[event].indexOf(callback);
            if (index > -1) {
                this.events[event].splice(index, 1);
            }
        } else {
            delete this.events[event];
        }
    }

    destroy() {
        for (const event of Object.keys(this.events)) {
            this.off(event as allowedEvents);
        }
    }
}