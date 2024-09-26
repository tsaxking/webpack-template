type Listener<T = unknown> = (data: T) => void;

class EM {
    public readonly events = new Map<string, Listener<unknown>[]>();

    destroyEvents() {
        this.events.clear();
    }
}

export class SimpleEventEmitter<E extends string> extends EM {
    constructor() {
        super();
    }

    on(event: E, listener: (...data: unknown[]) => void): void {
        const listeners = this.events.get(event) || [];
        listeners.push(listener);
        this.events.set(event, listeners);
    }

    off(event: E, listener?: (...data: unknown[]) => void): void {
        if (!listener) {
            this.events.delete(event);
            return;
        }
        const listeners = this.events.get(event) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event: E, ...data: unknown[]): void {
        const listeners = this.events.get(event) || [];
        listeners.forEach(listener => listener(data));
    }

    once(event: E, listener: (...data: unknown[]) => void): void {
        const onceListener = (...data: unknown[]) => {
            listener(...data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }
}

export class EventEmitter<E extends Record<string, unknown>> extends EM {
    constructor() {
        super();
    }

    on<K extends keyof E>(event: K, listener: Listener<E[K]>): void {
        const listeners = this.events.get(event as string) || [];
        listeners.push(listener as Listener<unknown>);
        this.events.set(event as string, listeners);
    }

    off<K extends keyof E>(event: K, listener?: Listener<E[K]>): void {
        if (!listener) {
            this.events.delete(event as string);
            return;
        }
        const listeners = this.events.get(event as string) || [];
        const index = listeners.indexOf(listener as Listener<unknown>);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    emit<K extends keyof E>(event: K, data: E[K]): void {
        const listeners = this.events.get(event as string) || [];
        listeners.forEach(listener => listener(data));
    }

    once<K extends keyof E>(event: K, listener: (data: E[K]) => void): void {
        const onceListener = (data: E[K]) => {
            listener(data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }
}
