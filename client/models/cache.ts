import { EventEmitter } from '../../shared/event-emitter';



type CacheTypes = 'created' | 'updated' | 'deleted' | 'archived' | 'restored';

export class Cache<ObjEmit = {}> {
    private static readonly $emitter: EventEmitter<CacheTypes> = new EventEmitter<CacheTypes>();
    static emit<K extends CacheTypes>(event: K, data: any): void {
        Cache.$emitter.emit(event, data);
    }

    static on<K extends CacheTypes>(event: K, callback: (data: any) => void): void {
        Cache.$emitter.on(event, callback);
    }

    static off<K extends CacheTypes>(event: K, callback?: (data: any) => void): void {
        Cache.$emitter.off(event, callback);
    }


    readonly $cache: Map<string, any> = new Map<string, any>();
    readonly $emitter: EventEmitter<keyof ObjEmit> = new EventEmitter<keyof ObjEmit>();

    public on<K extends keyof ObjEmit>(event: K, callback: (data: ObjEmit[K]) => void): void {
        this.$emitter.on(event, callback);
    }
    public off<K extends keyof ObjEmit>(event: K, callback?: (data: ObjEmit[K]) => void): void {
        this.$emitter.off(event, callback);
    };

    public destroy(): void {
        this.$emitter.destroy();
        this.$cache.clear();
    };
};