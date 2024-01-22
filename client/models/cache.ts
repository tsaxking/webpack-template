import { EventEmitter } from '../../shared/event-emitter';

/**
 * Global updates for all caches
 * @date 10/12/2023 - 1:04:42 PM
 *
 * @typedef {CacheUpdates}
 */
export type CacheUpdates =
    | 'create'
    | 'update'
    | 'delete'
    | 'archive'
    | 'restore'
    | '*';

/**
 * Cache is a class which allows you to store data in memory and listen for updates
 * @example
 * ```typescript
 * type UserEmitter = {
 *      'create': User // 'create' event will pass the new User object into the callback (you have to apply these yourself)
 * };
 *
 * class UserCache extends Cache<UserEmitter> {
 *    constructor(user: User) {
 *          super();
 *          // now do whatever you want
 *      }
 * }
 * @date 10/12/2023 - 1:04:42 PM
 *
 * @export
 * @class Cache
 * @typedef {Cache}
 */
export class Cache<data = unknown> {
    /**
     * Cache for storing data (any)
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @readonly
     * @type {Map<string, any>}
     */
    readonly $cache = new Map<string, unknown>();
    /**
     * Event emitter for cache object updates (passed in as a generic)
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @readonly
     * @type {EventEmitter<keyof data>}
     */
    readonly $emitter: EventEmitter<keyof data> = new EventEmitter<
        keyof data
    >();

    /**
     * Add a listener for cache object updates
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     * @template {keyof data} K
     * @param {K} event
     * @param {(data: data[K]) => void} callback
     */
    public on<K extends keyof data>(
        event: K,
        callback: (data: data[K]) => void,
    ): void {
        this.$emitter.on(event, callback);
    }
    /**
     * Remove a listener for cache object updates
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     * @template {keyof data} K
     * @param {K} event
     * @param {?(data: data[K]) => void} [callback]
     */
    public off<K extends keyof data>(
        event: K,
        callback?: (data: data[K]) => void,
    ): void {
        this.$emitter.off(event, callback);
    }

    public emit<K extends keyof data>(event: K, data: data[K]): void {
        this.$emitter.emit(event, data);
    }

    /**
     * Removes all listeners for cache object updates and clears the cache
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     */
    public destroy(): void {
        this.$emitter.destroy();
        this.$cache.clear();
    }
}
