import { EventEmitter } from '../../shared/event-emitter';



type Updates = 'create' | 'update' | 'delete' | 'archive' | 'restore' | '*';

export class Cache<ObjEmit = {}> {
    private static readonly $emitter: EventEmitter<Updates> = new EventEmitter<Updates>();

    public static on<K extends Updates>(event: K, callback: (data: any) => void): void {
        Cache.$emitter.on(event, callback);
    }

    public static off<K extends Updates>(event: K, callback?: (data: any) => void): void {
        Cache.$emitter.off(event, callback);
    }

    public static emit<K extends Updates>(event: K, data: any): void {
        Cache.$emitter.emit(event, data);
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