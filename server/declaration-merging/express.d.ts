import * as ExpressTypes from 'npm:@types/express';


declare module 'npm:express' {
    export namespace Express {


        export interface Request extends ExpressTypes.Request {
            session: import('../structure/sessions.ts').Session;
            start: number;
            io: import('npm:socket.io').Server;
            file?: {
                id: string;
                name: string;
                size: number;
                type: string;
                ext: string;
                contentType: string;
                filename: string
            }
            socketIO?: import('../structure/socket.ts').SocketWrapper;
        }
    }
}