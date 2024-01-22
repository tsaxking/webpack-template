import { sleep } from '../../shared/sleep';
import { notify } from './notifications';
import { EventEmitter } from '../../shared/event-emitter';
import { StatusJson } from '../../shared/status';
import { streamDelimiter } from '../../shared/text';
import { uuid as _uuid } from '../../server/utilities/uuid';
import { attemptAsync, Result } from '../../shared/attempt';

/**
 * These are optional options for a request
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @export
 * @typedef {RequestOptions}
 */
export type RequestOptions = {
    headers?: {
        [key: string]: string;
    };

    cached: boolean;
};

/**
 * These are optional options for a stream
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @export
 * @typedef {StreamOptions}
 */
export type StreamOptions = {
    headers?: {
        [key: string]: string;
    };
};

/**
 * These are the possible updates that can be emitted from a stream emitter
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @typedef {SendFileStreamEventData}
 */
type SendFileStreamEventData = {
    progress: ProgressEvent<EventTarget>;
    complete: ProgressEvent<EventTarget>;
    error: ProgressEvent<EventTarget>;
};

/**
 * Event emitter for sending a stream
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @typedef {RetrieveStreamEventData}
 * @template T
 */
type RetrieveStreamEventData<T> = {
    chunk: T;
    complete: T[];
    error: Error;
};

/**
 * Event emitter for retrieving a stream
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @export
 * @class RetrieveStreamEventEmitter
 * @typedef {RetrieveStreamEventEmitter}
 * @template [T=string]
 * @extends {EventEmitter<RetrieveStreamEvent<T>>}
 */
export class RetrieveStreamEventEmitter<T = string> extends EventEmitter<
    keyof RetrieveStreamEventData<T>
> {
    /**
     * Creates an instance of RetrieveStreamEventEmitter.
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Adds an event listener
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @template {RetrieveStreamEvent<T>} K
     * @param {K} event
     * @param {(data: RetrieveStreamEventData<T>[K]) => void} callback
     */
    on<K extends keyof RetrieveStreamEventData<T>>(
        event: K,
        callback: (data: RetrieveStreamEventData<T>[K]) => void,
    ): void {
        super.on(event, callback);
    }

    /**
     * Emits an event
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @template {RetrieveStreamEvent<T>} K
     * @param {K} event
     * @param {RetrieveStreamEventData<T>[K]} data
     */
    emit<K extends keyof RetrieveStreamEventData<T>>(
        event: K,
        data: RetrieveStreamEventData<T>[K],
    ): void {
        super.emit(event, data);
    }

    /**
     * Removes an event listener
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @template {RetrieveStreamEvent<T>} K
     * @param {K} event
     * @param {(data: RetrieveStreamEventData<T>[K]) => void} callback
     */
    off<K extends keyof RetrieveStreamEventData<T>>(
        event: K,
        callback: (data: RetrieveStreamEventData<T>[K]) => void,
    ): void {
        super.off(event, callback);
    }

    /**
     * Returns a promise that resolves when the stream is complete
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @readonly
     * @type {*}
     * @returns {Promise<T[]>}
     */
    get promise() {
        return new Promise<T[]>((res) => {
            this.on('complete', res);
        });
    }
}

/**
 * Events that can be emitted from a send stream
 * @date 1/8/2024 - 3:39:39 PM
 *
 * @typedef {SendStreamEventData}
 */
type SendStreamEventData = {
    end: undefined;
    error: Error;
    progress: number;
};

/**
 * Options for sending a stream
 * @date 1/8/2024 - 3:39:39 PM
 *
 * @typedef {SendStreamOptions}
 */
type SendStreamOptions = {
    rate: number;
};

/**
 * Sends a stream of data to the server, the back end must use the built in stream handler to receive the data
 * @date 1/8/2024 - 3:39:39 PM
 *
 * @class SendStream
 * @typedef {SendStream}
 */
export class SendStream {
    /**
     * Event emitter for sending a stream
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly $emitter = new EventEmitter<keyof SendStreamEventData>();
    /**
     * The data that will be sent to the server
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @private
     * @readonly
     * @type {string[]}
     */
    private readonly data: string[] = [];
    /**
     * The interval that sends the data to the server
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @private
     * @type {(number | NodeJS.Timeout)}
     */
    private interval: number | NodeJS.Timeout;

    /**
     * Creates an instance of SendStream.
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @constructor
     * @param {string} url
     * @param {SendStreamOptions} options
     */
    constructor(
        public readonly url: string,
        public readonly options: SendStreamOptions,
    ) {}

    /**
     * Add data you want sent to the server
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @param {string} data
     */
    add(data: string) {
        this.data.push(data);
    }

    /**
     * Adds an event listener
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @template {keyof SendStreamEventData} K
     * @param {K} event
     * @param {(data: SendStreamEventData[K]) => void} callback
     */
    on<K extends keyof SendStreamEventData>(
        event: K,
        callback: (data: SendStreamEventData[K]) => void,
    ): void {
        this.$emitter.on(event, callback);
    }

    /**
     * Emits an event
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @template {keyof SendStreamEventData} K
     * @param {K} event
     * @param {SendStreamEventData[K]} data
     */
    emit<K extends keyof SendStreamEventData>(
        event: K,
        data: SendStreamEventData[K],
    ): void {
        this.$emitter.emit(event, data);
    }

    /**
     * Removes an event listener
     * @date 1/8/2024 - 3:39:39 PM
     *
     * @template {keyof SendStreamEventData} K
     * @param {K} event
     * @param {(data: SendStreamEventData[K]) => void} callback
     */
    off<K extends keyof SendStreamEventData>(
        event: K,
        callback: (data: SendStreamEventData[K]) => void,
    ): void {
        this.$emitter.off(event, callback);
    }

    /**
     * Sends the data to the server on an interval (will not stop until you call stop())
     * @date 1/8/2024 - 3:39:39 PM
     */
    send() {
        let i = 0;
        this.interval = setInterval(async () => {
            if (this.data.length) {
                const data = this.data.shift();
                if (data) {
                    ServerRequest.post<{
                        index: number;
                        status: 'received' | 'end' | 'error';
                    }>(this.url, {
                        data,
                        index: i,
                        size: new TextEncoder().encode(data).length,
                        type: 'data',
                    })
                        .then((data) => {
                            if (data.isOk()) {
                                const { value } = data;

                                switch (value.status) {
                                    case 'received':
                                        this.emit('progress', i);
                                        break;
                                    case 'end':
                                        this.emit('end', undefined);
                                        break;
                                    case 'error':
                                        this.emit(
                                            'error',
                                            new Error('Server error'),
                                        );
                                        break;
                                }
                            }
                        })
                        .catch((error: Error) => {
                            this.emit('error', error);
                        });
                }

                i++;
            }
        }, this.options.rate); // 30 fps
    }

    /**
     * Stops the stream
     * @date 1/8/2024 - 3:39:39 PM
     */
    stop() {
        if (this.interval) clearInterval(this.interval);
        this.emit('end', undefined);
        ServerRequest.post(this.url, {
            type: 'end',
        });
    }
}

/**
 * This class is meant for the purpose of sending requests to the hosted server using fetch and xhr requests
 * @date 10/12/2023 - 1:19:15 PM
 *
 * @export
 * @class ServerRequest
 * @typedef {ServerRequest}
 * @template [T=unknown]
 */
export class ServerRequest<T = unknown> {
    /**
     * List of all requests (for caching, debugging, and statistics)
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {ServerRequest[]}
     */
    static readonly all: ServerRequest[] = [];

    /**
     * Retrieves the last request sent
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {(ServerRequest|undefined)}
     */
    static get last(): ServerRequest | undefined {
        return this.all[this.all.length - 1];
    }

    /**
     * Retrieves all requests that failed
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {ServerRequest[]}
     */
    static get errors(): ServerRequest[] {
        return this.all.filter((r) => r.error);
    }

    /**
     * Retrieves all requests that succeeded
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {ServerRequest[]}
     */
    static get successes(): ServerRequest[] {
        return this.all.filter((r) => !r.error);
    }

    /**
     * Average duration of all requests that succeeded
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {number}
     */
    static get averageDuration(): number {
        return this.totalDuration / this.all.length;
    }

    /**
     * Total duration of all requests that succeeded
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {number}
     */
    static get totalDuration(): number {
        return this.successes.reduce((a, b) => a + (b.duration || 0), 0);
    }

    /**
     * Total number of requests that failed
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @readonly
     * @type {number}
     */
    static get totalErrors(): number {
        return this.errors.length;
    }

    /**
     * Send a post request to the server that returns a promise with a generic type
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @async
     * @template T
     * @param {string} url
     * @param {?*} [body]
     * @param {?RequestOptions} [options]
     * @returns {Promise<T>}
     */
    static async post<T>(
        url: string,
        body?: unknown,
        options?: RequestOptions,
    ): Promise<Result<T>> {
        return attemptAsync(async () => {
            const r = new ServerRequest<T>(url, 'post', body, options);
            return r.send();
        });
    }

    /**
     * Send a get request to the server that returns a promise with a generic type
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @async
     * @template T
     * @param {string} url
     * @param {?RequestOptions} [options]
     * @returns {Promise<T>}
     */
    static async get<T>(
        url: string,
        options?: RequestOptions,
    ): Promise<Result<T>> {
        return attemptAsync(async () => {
            const r = new ServerRequest<T>(url, 'get', undefined, options);
            return r.send();
        });
    }

    /**
     * Send multiple requests at once, returns a promise with an array of generic types
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @async
     * @param {ServerRequest[]} requests
     * @returns {Promise<any[]>}
     */
    static async multiple(requests: ServerRequest[]): Promise<unknown[]> {
        return Promise.all(requests.map((r) => r.send()));
    }

    /**
     * Sends a stream of files to the server, the back end must use the built in stream handler to receive the files
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @param {string} url
     * @param {FileList} files
     * @param {?*} [body]
     * @param {?StreamOptions} [options]
     * @returns {EventEmitter<keyof SendFileStreamEventData>}
     */
    static streamFiles(
        url: string,
        files: FileList,
        body?: unknown,
        options?: StreamOptions,
    ): EventEmitter<keyof SendFileStreamEventData> {
        const emitter = new EventEmitter<keyof SendFileStreamEventData>();

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
        };

        xhr.upload.onerror = (e) => {
            emitter.emit('error', e);
        };

        xhr.upload.onload = (e) => {
            emitter.emit('complete', e);
        };

        xhr.send(formData);
        return emitter;
    }

    /**
     * If the server is sending a stream of data, this method will retrieve it, server must use res.stream(string[])
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @static
     * @template [K=string]
     * @param {string} url
     * @param {?*} [body]
     * @param {?(data: string) => K} [parser]
     * @returns {RetrieveStreamEventEmitter<K>}
     */
    static retrieveStream<K = string>(
        url: string,
        body?: unknown,
        parser?: (data: string) => K,
    ): RetrieveStreamEventEmitter<K> {
        const output: K[] = [];

        const emitter = new RetrieveStreamEventEmitter<K>();

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
            .then((res) => {
                const dataLength = parseInt(
                    res.headers.get('x-data-length') || '0',
                );

                const reader = res.body?.getReader();
                if (!reader) {
                    return emitter.emit('error', new Error('No reader found'));
                }

                let i = 0;
                let last: string | undefined;
                reader.read().then(function process({ done, value }) {
                    if (done) {
                        emitter.emit('complete', output);
                        return;
                    }

                    if (value) {
                        const d = new TextDecoder().decode(value);
                        // console.log(done, d);
                        const split = d.split(streamDelimiter);
                        if (last) split[0] = last + split[0];
                        last = split.pop();

                        for (let s of split) {
                            s = decodeURI(s);
                            if (s) {
                                i++;
                                if (parser) {
                                    output.push(parser(s));
                                    emitter.emit('chunk', parser(s));
                                } else {
                                    output.push(s as K);
                                    emitter.emit('chunk', s as K);
                                }

                                if (i >= dataLength) {
                                    emitter.emit('complete', output);
                                }
                            }
                        }
                    }
                    return reader.read().then(process);
                });
            })
            .catch((e) => emitter.emit('error', new Error(e)));

        return emitter;
    }

    /**
     * Sends a stream of data to the server, the back end must use the built in stream handler to receive the data
     * @param {string} url
     * @param {SendStreamOptions} [options]
     * @returns {SendStream}
     */
    static stream(url: string, data?: string[], options?: SendStreamOptions) {
        const sendStream = new SendStream(
            url,
            options || {
                rate: 1000 / 30,
            },
        );

        if (data) {
            for (const d of data) {
                sendStream.add(d);
            }
        }

        return sendStream;
    }

    /**
     * Server response
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {?*}
     */
    public response?: T;
    /**
     * Time the request was initialized
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {number}
     */
    public initTime: number = Date.now();
    /**
     * Error that occurred (if any)
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {?Error}
     */
    public error?: Error;
    /**
     * Whether or not the request has been sent
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {boolean}
     */
    public sent = false;
    /**
     *  Duration of the request
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {?number}
     */
    public duration?: number;
    /**
     * Promise that resolves when the request is complete
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @public
     * @type {?Promise<T>}
     */
    public promise?: Promise<T>;
    /**
     * Whether or not the request was cached
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @private
     * @type {boolean}
     */
    private cached = false;

    /**
     * Creates an instance of ServerRequest.
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @constructor
     * @param {string} url
     * @param {('get' | 'post')} [method='post']
     * @param {?*} [body]
     * @param {?RequestOptions} [options]
     */
    constructor(
        public readonly url: string,
        public readonly method: 'get' | 'post' = 'post',
        public readonly body?: unknown,
        public readonly options?: RequestOptions,
    ) {
        ServerRequest.all.push(this);
    }

    /**
     * Sends the request to the server and returns a promise with a generic type
     * @date 10/12/2023 - 1:19:15 PM
     *
     * @async
     * @returns {Promise<T>}
     */
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
                    this.response = req.response as T;
                    req.promise?.then((r) => res(r as T));
                }
            }

            fetch(this.url, {
                method: this.method.toUpperCase(),
                headers: {
                    'Content-Type': 'application/json',
                    ...this.options?.headers,
                },
                body: JSON.stringify(this.body),
            })
                .then((r) => r.json())
                .then(async (data) => {
                    if (this.cached) console.log(data, '(cached)');
                    else console.log(data);

                    if (data?.$status) {
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
