import { WebSocketServer } from 'https://deno.land/x/websocket@v0.1.4/mod.ts';

export class SocketWrapper {
    private readonly io?: WebSocketServer;

    constructor(port: number) {
        this.io = new WebSocketServer(port);
    }

    on(event: string, callback: (data: any) => void) {
        this.io?.on(event, callback);
    }

    emit(event: string, data: any) {
        this.io?.emit(event, data);
    }

    close() {
        this.io?.close();
    }

    off(event: string, callback: (data: any) => void) {
        this.io?.off(event, callback);
    }

    once(event: string, callback: (data: any) => void) {
        this.io?.once(event, callback);
    }
}

