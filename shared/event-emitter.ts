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
 * @template [allowedEvents=(string | number | '*')]
 */
export class EventEmitter<allowedEvents = string | number | '*'> {
    /**
     * All events and their listeners as a map
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @public
     * @readonly
     * @type {Map<allowedEvents, ListenerCallback[]>}
     */
    public readonly events: Map<allowedEvents, ListenerCallback[]> = new Map<
        allowedEvents,
        ListenerCallback[]
    >();

    /**
     * Adds a listener for the given event
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @param {allowedEvents} event
     * @param {ListenerCallback} callback
     */
    on(event: allowedEvents, callback: ListenerCallback) {
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
     * @param {allowedEvents} event
     * @param {...unknown[]} args
     */
    emit(event: allowedEvents, ...args: unknown[]) {
        if (typeof event !== 'string' && typeof event !== 'number') {
            throw new Error('Event must be a string');
        }
        if (!this.events.has(event)) {
            return;
        }

        this.events.get(event)?.forEach((callback) => callback(...args));
        this.events
            .get('*' as allowedEvents)
            ?.forEach((callback) => callback(...args));
    }

    /**
     * Removes a listener for the given event
     * @date 10/12/2023 - 1:46:22 PM
     *
     * @param {allowedEvents} event
     * @param {?ListenerCallback} [callback]
     */
    off(event: allowedEvents, callback?: ListenerCallback) {
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
    once(event: allowedEvents, callback: ListenerCallback) {
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
            this.off(event as allowedEvents);
        }
    }
}
