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
export class Cache<
    data extends Record<string, unknown>
> extends EventEmitter<data> {
    /**
     * Cache for storing data (any)
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @readonly
     * @type {Map<string, any>}
     */
    readonly cache = new Map<string, unknown>();

    /**
     * Removes all listeners for cache object updates and clears the cache
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     */
    public destroy(): void {
        this.destroyEvents();
        this.cache.clear();
    }
}
