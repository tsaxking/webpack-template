import { EventEmitter } from "../../../shared/event-emitter";

/**
 * Global Cache Events
 *
 * @typedef {Events}
 */
type Events = {
    'update': Cache<unknown>;
    'delete': Cache<unknown>;
    'new': Cache<unknown>;
}

/**
 * Backend Cache
 *
 * @export
 * @class Cache
 * @typedef {Cache}
 * @template E
 */
export class Cache<E> {
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
    public static on<K extends keyof Events>(event: K, listener: (cache: Cache<Events>) => void) {
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
    public static off<K extends keyof Events>(event: K, listener: (cache: Cache<Events>) => void) {
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
    public static emit<K extends keyof Events>(event: K, cache: Cache<Events>) {
        this.emitter.emit(event, cache);
    }

    /**
     * Creates an instance of Cache.
     *
     * @constructor
     */
    constructor() {}

    /**
     * Event Emitter for Cache Events
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly emitter = new EventEmitter<keyof E>();

    /**
     * Adds a listener to a cache event
     *
     * @public
     * @template {keyof E} K
     * @param {K} event
     * @param {(cache: Cache<E>) => void} listener
     * @returns {void) => void}
     */
    public on<K extends keyof E>(event: K, listener: (cache: Cache<E>) => void) {
        this.emitter.on(event, listener);
    }

    /**
     * Removes a listener from a cache event
     *
     * @public
     * @template {keyof E} K
     * @param {K} event
     * @param {(cache: Cache<E>) => void} listener
     * @returns {void) => void}
     */
    public off<K extends keyof E>(event: K, listener: (cache: Cache<E>) => void) {
        this.emitter.off(event, listener);
    }

    /**
     * Emits a cache event
     *
     * @public
     * @template {keyof E} K
     * @param {K} event
     */
    public emit<K extends keyof E>(event: K) {
        this.emitter.emit(event, this);
    }

    /**
     * Destroys the cache
     *
     * @public
     */
    public destroy() {
        Cache.emit('delete', this as Cache<unknown>);
    }

    /**
     * Updates the cache
     *
     * @public
     */
    public update() {
        Cache.emit('update', this as Cache<unknown>);
    }
}