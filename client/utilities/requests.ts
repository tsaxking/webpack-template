import { sleep } from "../../shared/sleep";
import { notify } from "./notifications";
import { EventEmitter } from '../../shared/event-emitter';
import { StatusJson } from "../../shared/status";

export type RequestOptions = {
    headers?: {
        [key: string]: string;
    };

    cached: boolean;
};

export type StreamOptions = {
    headers?: {
        [key: string]: string;
    }
};


type SendStreamEventData = {
    'progress': ProgressEvent<EventTarget>;
    'complete': ProgressEvent<EventTarget>;
    'error': ProgressEvent<EventTarget>;
};

type StreamEvent = keyof SendStreamEventData;

type RetrieveStreamEventData<T> = {
    'chunk': T;
    'complete': T[];
    'error': Error;
};

type RetrieveStreamEvent<T> = keyof RetrieveStreamEventData<T>;





export class RetrieveStreamEventEmitter<T = string> extends EventEmitter<RetrieveStreamEvent<T>> {
    constructor() {
        super();
    }

    on<K extends RetrieveStreamEvent<T>>(event: K, callback: (data: RetrieveStreamEventData<T>[K]) => void): void {
        super.on(event, callback);
    }

    emit<K extends RetrieveStreamEvent<T>>(event: K, data: RetrieveStreamEventData<T>[K]): void {
        super.emit(event, data);
    }

    off<K extends RetrieveStreamEvent<T>>(event: K, callback: (data: RetrieveStreamEventData<T>[K]) => void): void {
        super.off(event, callback);
    }

    get promise() {
        return new Promise<T[]>((res, rej) => {
            this.on('complete', res);
        });
    }
}





export class ServerRequest<T = unknown> {
    static readonly all: ServerRequest[] = [];

    static get last(): ServerRequest|undefined {
        return this.all[this.all.length - 1];
    }

    static get errors(): ServerRequest[] {
        return this.all.filter((r) => r.error);
    }

    static get successes(): ServerRequest[] {
        return this.all.filter((r) => !r.error);
    }

    static get averageDuration(): number {
        return this.totalDuration / this.all.length;
    }

    static get totalDuration(): number {
        return this.all.reduce((a, b) => a + (b.duration || 0), 0);
    }

    static get totalErrors(): number {
        return this.errors.length;
    }

    static async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
        const r = new ServerRequest<T>(url, 'post', body, options);
        return r.send();
    }


    static async get<T>(url: string, options?: RequestOptions): Promise<T> {
        const r = new ServerRequest<T>(url, 'get', undefined, options);
        return r.send();
    }

    static async multiple(requests: ServerRequest[]): Promise<any[]> {
        return Promise.all(requests.map((r) => r.send()));
    }


    static streamFiles(url: string, files: FileList, body?: any, options?: StreamOptions): EventEmitter<StreamEvent> {
        const emitter = new EventEmitter<StreamEvent>();

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.setRequestHeader('X-File-Count', files.length.toString());

        if (options?.headers) {
            for (const key in options.headers) {
                xhr.setRequestHeader('X-Custom-' + key, options.headers[key]);
            }
        }

        if (body) {
            try {
                JSON.stringify(body);
            } catch {
                throw new Error('Body must be able to be parsed as JSON');
            }

            xhr.setRequestHeader('X-Body', JSON.stringify(body));
        }


        xhr.upload.onprogress = (e) => {
            emitter.emit('progress', e);
        }

        xhr.upload.onerror = (e) => {
            emitter.emit('error', e);
        }

        xhr.upload.onload = (e) => {
            emitter.emit('complete', e);
        }

        xhr.send(formData);
        return emitter;
    }

    static retrieveStream<K = string>(url: string, body?: any, parser?: (data: string) => K): RetrieveStreamEventEmitter<K> {
        const output: K[] = [];

        const emitter = new RetrieveStreamEventEmitter<K>();

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(r => r.body?.getReader())
            .then(reader => {
                if (!reader) return emitter.emit('error', new Error('No reader found'));

                reader.read().then(function process({ done, value }) {
                    if (done) {
                        emitter.emit('complete', output);
                        return;
                    }

                    if (value) {
                        const d = new TextDecoder().decode(value);
                        if (parser) {
                            output.push(parser(d));
                            emitter.emit('chunk', parser(d));
                        } else {
                            output.push(d as K);
                            emitter.emit('chunk', d as K);
                        }
                    }
                    return reader.read().then(process);
                });
            })
            .catch(e => emitter.emit('error', new Error(e)));

        return emitter;
    }

    public response?: any;
    public initTime: number = Date.now();
    public error?: Error;
    public sent: boolean = false;
    public duration?: number;
    public promise?: Promise<T>;
    private cached: boolean = false;

    constructor(
        public readonly url: string,
        public readonly method: 'get' | 'post' = 'post',
        public readonly body?: any,
        public readonly options?: RequestOptions
    ) {
        ServerRequest.all.push(this);
    }



    async send(): Promise<T> {
        this.promise = new Promise<T>((res, rej) => {
            try {
                JSON.stringify(this.body);
            } catch {
                throw new Error('Body must be able to be parsed as JSON');
            }
            const start = Date.now();
            this.sent = true;

            if (this.options?.cached) {
                const reqs = ServerRequest.all.filter((r) => r.url == this.url);
                const req = reqs[reqs.length - 1];
                if (req) {
                    this.cached = true;
                    this.duration = Date.now() - start;
                    this.response = req.response;
                    req.promise?.then((r) => res(r as T));
                }
            }


            fetch(this.url, {
                method: this.method.toUpperCase(),
                headers: {
                    'Content-Type': 'application/json',
                    ...this.options?.headers
                },
                body: JSON.stringify(this.body)
            })
                .then((r) => r.json())
                .then(async (data) => {
                    if (this.cached) console.log(data, '(cached)'); 
                    else console.log(data);

                    if (data?.status) {
                        // this is a notification
                        notify(data as StatusJson);
                    }


                    this.duration = Date.now() - start;
                    this.response = data;

                    if (data?.redirect) {
                        if (typeof data.sleep !== 'number') data.sleep = 1000;
                        await sleep(data.sleep);
                        location.href = data.redirect;
                    }
                    res(data as T);
                })
                .catch((e) => {
                    this.duration = Date.now() - start;
                    this.error = new Error(e);
                    rej(e);
                });
        });

        return this.promise;
    }
}