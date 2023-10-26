import { EventEmitter } from '../../shared/event-emitter';



/**
 * Global updates for all caches
 * @date 10/12/2023 - 1:04:42 PM
 *
 * @typedef {Updates}
 */
type Updates = 'create' | 'update' | 'delete' | 'archive' | 'restore' | '*';

export class Cache<data = {}> {
    private static readonly $emitter: EventEmitter<Updates> = new EventEmitter<Updates>();

    /**
     * Add a listener for global updates
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     * @static
     * @template {Updates} K
     * @param {K} event
     * @param {(data: any) => void} callback
     */
    public static on<K extends Updates>(event: K, callback: (data: any) => void): void {
        Cache.$emitter.on(event, callback);
    }

    /**
     * Remove a listener for global updates
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     * @static
     * @template {Updates} K
     * @param {K} event
     * @param {?(data: any) => void} [callback]
     */
    public static off<K extends Updates>(event: K, callback?: (data: any) => void): void {
        Cache.$emitter.off(event, callback);
    }

    /**
     * Emit a global update
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @public
     * @static
     * @template {Updates} K
     * @param {K} event
     * @param {*} data
     */
    public static emit<K extends Updates>(event: K, data: any): void {
        Cache.$emitter.emit(event, data);
    }

    /**
     * Cache for storing data (any)
     * @date 10/12/2023 - 1:04:42 PM
     *
     * @readonly
     * @type {Map<string, any>}
     */
    readonly $cache: Map<string, any> = new Map<string, any>();
    readonly $emitter: EventEmitter<keyof data> = new EventEmitter<keyof data>();

    public on<K extends keyof data>(event: K, callback: (data: data[K]) => void): void {
        this.$emitter.on(event, callback);
    }
    public off<K extends keyof data>(event: K, callback?: (data: data[K]) => void): void {
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
};