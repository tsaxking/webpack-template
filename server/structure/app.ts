// make a class that simulates npm:express using the deno std library
import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.1.1/mod.ts";
import { __root } from "../utilities/env.ts";
import PATH from 'npm:path';
import { log } from "../utilities/terminal-logging.ts";
import { Session } from "./sessions.ts";


const fileTypeHeaders = {
    js: 'application/javascript',
    css: 'text/css',
    html: 'text/html',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    txt: 'text/plain',
    pdf: 'application/pdf',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    xml: 'application/xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    mov: 'video/quicktime',
    mpeg: 'video/mpeg',
    flv: 'video/x-flv'
};



type BodyValue = string | number | boolean | null | undefined;

type Body = {
    [key: string]: BodyValue | BodyValue[] | Body | Body[]
} | BodyValue[] | BodyValue;



type CustomRequest = Request & {
    params: {
        [key: string]: string
    }

    session: Session;
    content: any;
}



export class Route {
    public readonly serverFunctions: ServerFunctionHandler[] = [];


    constructor(public readonly path: string) {
    }



    get(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }

    post(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.POST
        })));

        return this;
    }


    use(path: string, ...callbacks: ServerFunction[]) {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }



    route(path: string, route: Route) {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        return this;
    }
}

enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}



export type ServerFunction = (req: CustomRequest) => any;
type ServerFunctionHandler = {
    path: string;
    callback: ServerFunction;
    method: RequestMethod;
}

type AppOptions = {
    onListen?: (server: Deno.Server) => void;
    onConnection?: () => void;
    onDisconnect?: () => void;
    ioPort?: number;
};


export class App {
    public readonly io: Server = new Server();
    public readonly server: Deno.Server;

    constructor(public readonly port: number, public readonly domain: string, options?: AppOptions) {
        this.server = Deno.serve({ port: this.port }, this.handleHttp.bind(this));

        if (options) {
            if (options.onListen) {
                options.onListen(this.server);
            }

            if (options.ioPort) {
                serve(this.io.handler(), { port: options.ioPort });
            }
        }
    };

    private async handleHttp(req: Request): Promise<Response> {
        const extName = PATH.extname(req.url).replace('.', '');
        const url = new URL(req.url, this.domain);
        log(`[${req.method}]`, url);


        const fns = this.serverFunctions.filter(sf => {


            if (sf.method !== req.method) return false;
            if (sf.path === url.pathname) return true;
            if (sf.path.endsWith('*')) {
                const pathParts = sf.path.split('/');
                const urlParts = url.pathname.split('/');

                if (pathParts.length !== urlParts.length) return false;

                for (let i = 0; i < pathParts.length; i++) {
                    if (pathParts[i] === '*') return true;
                    if (pathParts[i].startsWith(':')) continue;
                    if (pathParts[i] !== urlParts[i]) return false;
                }

                return true;
            }

            return false;
        });

        for (const fn of fns) {
            (req as CustomRequest).params = extractParams(fn.path, url.pathname);
            (req as CustomRequest).content = await req.json();

            const d = await fn.callback(req as CustomRequest);
            if (d) {
                switch (req.method) {
                    case 'GET':
                        return new Response(d, {
                            headers: {
                                'Content-Type': fileTypeHeaders[extName as keyof typeof fileTypeHeaders] || 'text/plain'
                            }
                        });
                    case 'POST': 
                        return new Response(JSON.stringify(d), {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                    default: 
                        return new Response(d);
                }
            }
        }

        return new Response('404 Not Found', { status: 404 });
    }

    private readonly serverFunctions: ServerFunctionHandler[] = [];



    static(path: string, filePath: string) {
        this.get(path + '/*', async (req) => {
            return Deno.readFile(
                PATH.resolve(
                    __root,
                    filePath,
                    '.' + req.url.replace(path, '').replace(this.domain, '')
                )
            )
        });
    }



    get(path: string, ...callbacks: ServerFunction[]): App {
        this.serverFunctions.push(...callbacks.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));

        return this;
    }


    use(path: string, ...callback: ServerFunction[]): App {
        this.serverFunctions.push(...callback.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.GET
        })));
        return this;
    }

    post(path: string, ...callback: ServerFunction[]): App {
        this.serverFunctions.push(...callback.map(cb => ({
            path: path,
            callback: cb,
            method: RequestMethod.POST
        })));

        return this;
    }


    route(path: string, route: Route): App {
        this.serverFunctions.push(...route.serverFunctions.map(sf => ({
            path: path + sf.path,
            callback: sf.callback,
            method: sf.method
        })));
        return this;
    }
}


const extractParams = (path: string, url: string): {
    [key: string]: string
} => {
    const params: {
        [key: string]: string
    } = {};
    const pathParts = path.split('/');
    const urlParts = url.split('/');

    for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i].startsWith(':')) {
            params[pathParts[i].replace(':', '')] = urlParts[i];
        }
    }

    return params;
};
