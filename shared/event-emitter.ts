/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Callback for event listeners
 * @date 10/12/2023 - 1:46:22 PM
 *
 * @typedef {ListenerCallback}
 */
type ListenerCallback = (...args: any[]) => void;

/**
 * Event emitter object, this is used to emit events and listen for events
 * To typesafe the events, use the generic parameter
 * To typesafe callback parameters, it is recommended to either use inheritance of composition
 * @date 10/12/2023 - 1:46:22 PM
 *
 * @export
 * @class EventEmitter
 * @typedef {EventEmitter}
 * @template [events=(string | number | '*')]
 */
export class EventEmitter<events = string | number | '*'> {
    /**
     * All events and their listeners as a map
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @public
     * @readonly
     * @type {Map<events, ListenerCallback[]>}
     */
    public readonly events: Map<events, ListenerCallback[]> = new Map<
        events,
        ListenerCallback[]
    >();

    /**
     * Adds a listener for the given event
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @param {events} event
     * @param {ListenerCallback} callback
     */
    on(event: events, callback: ListenerCallback) {
        if (typeof event !== 'string' && typeof event !== 'number') {
            throw new Error('Event must be a string');
        }
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event)?.push(callback);
    }

    /**
     * Emits an event with the given arguments
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @param {events} event
     * @param {...unknown[]} args
     */
    emit(event: events, ...args: unknown[]) {
        if (typeof event !== 'string' && typeof event !== 'number') {
            throw new Error('Event must be a string');
        }
        if (!this.events.has(event)) {
            return;
        }

        for (const callback of this.events.get(event) ?? []) {
            callback(...args);
        }

        for (const callback of this.events.get('*' as events) ?? []) {
            callback(event, ...args);
        }
    }

    /**
     * Removes a listener for the given event
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @param {events} event
     * @param {?ListenerCallback} [callback]
     */
    off(event: events, callback?: ListenerCallback) {
        if (typeof event !== 'string' && typeof event !== 'number') {
            throw new Error('Event must be a string');
        }
        if (!this.events.has(event)) {
            return;
        }

        if (callback) {
            this.events.set(
                event,
                this.events.get(event)?.filter((cb) => cb !== callback) ?? [],
            );
        } else {
            this.events.set(event, []);
        }
    }

    /**
     * Adds a listener for the given event, but removes it after it has been called once
     * @param event
     * @param callback
     */
    once(event: events, callback: ListenerCallback) {
        const onceCallback = (...args: unknown[]) => {
            callback(...args);
            this.off(event, onceCallback);
        };

        this.on(event, onceCallback);
    }

    /**
     * Removes all listeners for all events
     * @date 10/12/2023 - 1:46:22 PM
     */
    destroy() {
        for (const event of Object.keys(this.events)) {
            this.off(event as events);
        }
    }
}
