import { EventEmitter } from '../../shared/event-emitter';





export class Cache<data = {}> {
    readonly $cache: Map<string, any> = new Map<string, any>();
    readonly $emitter: EventEmitter<keyof data> = new EventEmitter<keyof data>();

    public on<K extends keyof data>(event: K, callback: (data: data[K]) => void): void {
        this.$emitter.on(event, callback);
    }
    public off<K extends keyof data>(event: K, callback?: (data: data[K]) => void): void {
        this.$emitter.off(event, callback);
    };

    public destroy(): void {
        this.$emitter.destroy();
        this.$cache.clear();
    };
};