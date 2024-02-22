import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.1.1/mod.ts";
import { log } from '../utilities/terminal-logging.ts';
import env from '../utilities/env.ts';

export class SocketWrapper {
    private readonly io: Server;

    constructor(port: number) {
        this.io = new Server();
        serve(this.io.handler(), {
            port,
            // wss
        });

        this.io.on('connection', (socket: any) => {
            log('New connection:', socket.id);

            // socket.join(socket.id);

            // join tab session
            socket.on('ssid', (ssid: string) => {
                socket.join(ssid);
                socket.off('ssid');
            });

            // reload on file change
            if (env.ENVIRONMENT === 'dev') {
                socket.emit('reload');
            }
        });
    }

    on(event: string, callback: (data?: unknown) => void) {
        this.io.on(event, callback);
    }

    emit(event: string, data?: unknown) {
        this.io.emit(event, data);
    }

    close() {
        this.io.close();
    }

    off(event: string, callback: (data?: unknown) => void) {
        this.io.off(event, callback);
    }

    once(event: string, callback: (data?: unknown) => void) {
        this.io.once(event, callback);
    }

    to(room: string) {
        return this.io.to(room);
    }
}

