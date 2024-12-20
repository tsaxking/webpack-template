import { Subscriber, Writable } from 'svelte/store';

export class List<T> implements Writable<T[]> {
    constructor(private _data: T[]) {}

    private _onUnsubscribe?: () => void;

    private readonly subscribers = new Set<Subscriber<T[]>>();

    get data() {
        return this._data;
    }

    add(...data: T[]) {
        this.update(t => [...t, ...data]);
    }

    update(fn: (current: T[]) => T[]) {
        this.set(fn(this._data));
    }

    set(data: T[]) {
        this._data = data;
        this.subscribers.forEach(s => s(this._data));
    }

    subscribe(fn: (data: T[]) => void) {
        this.subscribers.add(fn);
        return () => {
            this.subscribers.delete(fn);
            if (this.subscribers.size === 0) this._onUnsubscribe?.();
        };
    }

    onUnsubscribe(fn: () => void) {
        this._onUnsubscribe = fn;
    }
}
