import { EventEmitter } from '../../../shared/event-emitter';

/**
 * Global Cache Events
 *
 * @typedef {Events}
 */
type Events = {
    update: Cache;
    delete: Cache;
    new: Cache;
};

/**
 * Backend Cache
 *
 * @export
 * @class Cache
 * @typedef {Cache}
 * @template E
 */
export class Cache {
    /**
     * Event Emitter for Global Cache Events
     *
     * @private
     * @static
     * @readonly
     * @type {*}
     */
    private static readonly emitter = new EventEmitter();

    /**
     * Adds a listener to a global cache event
     *
     * @public
     * @static
     * @template {keyof Events} K
     * @param {K} event
     * @param {(cache: Cache<Events>) => void} listener
     * @returns {void) => void}
     */
    public static on<K extends keyof Events>(
        event: K,
        listener: (cache: Events[K]) => void
    ) {
        this.emitter.on(event, listener);
    }

    /**
     * Removes a listener from a global cache event
     *
     * @public
     * @static
     * @template {keyof Events} K
     * @param {K} event
     * @param {(cache: Cache<Events>) => void} listener
     * @returns {void) => void}
     */
    public static off<K extends keyof Events>(
        event: K,
        listener: (cache: Events[K]) => void
    ) {
        this.emitter.off(event, listener);
    }

    /**
     * Emits a global cache event
     *
     * @public
     * @static
     * @template {keyof Events} K
     * @param {K} event
     * @param {Cache<Events>} cache
     */
    public static emit<K extends keyof Events>(event: K, cache: Events[K]) {
        this.emitter.emit(event, cache);
    }

    /**
     * Creates an instance of Cache.
     *
     * @constructor
     */
    constructor() {}

    /**
     * Destroys the cache
     *
     * @public
     */
    public destroy() {
        Cache.emit('delete', this);
    }
}
