import express from 'express';
import { App } from './app';
import { attempt, Result } from '../../../shared/check';
import { StatusCode, StatusId } from '../../../shared/status-messages';
import { bigIntEncode } from '../../../shared/objects';
import { Status } from '../../utilities/status';
import { Req } from './req';
import render, { Constructor } from 'node-html-constructor/versions/v4';
import { EventEmitter } from '../../../shared/event-emitter';
import { getTemplateSync } from '../../utilities/files';
import { ReadableStream } from 'stream/web';
import { streamDelimiter } from '../../../shared/text';

/**
 * The event types for the stream
 * @date 10/12/2023 - 3:06:02 PM
 *
 * @typedef {StreamEventData}
 */
type StreamEventData<T> = {
    error: Error;
    end: undefined;
    cancel: undefined;
    chunk: T;
};

interface StreamInterface<T> {
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'end', listener: () => void): void;
    on(event: 'close', listener: () => void): void;
    on(event: 'data', listener: (chunk: T) => void): void;

    pipe(fn: (chunk: T, i: number) => void): void;
}

/**
 * Response class
 * @date 3/8/2024 - 6:19:36 AM
 *
 * @export
 * @class Res
 * @typedef {Res}
 */
export class Res {
    /**
     * If the response has been fulfilled
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @public
     * @type {boolean}
     */
    public fulfilled = false;
    /**
     * Current status code
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @public
     * @type {StatusCode}
     */
    public _status: StatusCode = 200;

    /**
     * Creates an instance of Res.
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @constructor
     * @param {App} app
     * @param {express.Response} res
     * @param {Req} req
     */
    constructor(
        public readonly app: App,
        public readonly res: express.Response,
        public readonly req: Req
    ) {}

    /**
     * Checks if the response has been fulfilled
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @private
     * @returns {boolean}
     */
    private isFulfilled() {
        if (this.fulfilled) {
            throw new Error('Response already fulfilled');
        }
        this.fulfilled = true;
        return false;
    }

    /**
     * Sends a json response
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {unknown} data
     * @returns {*}
     */
    json(data: unknown) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.json(data);
        });
    }

    /**
     * Sends a response
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} data
     * @returns {*}
     */
    send(data: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.send(data);
        });
    }

    /**
     * Sends a file
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} path
     * @returns {*}
     */
    sendFile(path: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.sendFile(path);
        });
    }

    /**
     * Sets the status code
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {StatusCode} code
     * @returns {*}
     */
    status(code: StatusCode): this {
        this._status = code;
        this.res.status(code);
        return this;
    }

    /**
     * Redirects to a different path
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} path
     * @returns {*}
     */
    redirect(path: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.redirect(path);
        });
    }

    /**
     * Adds a cookie to the response
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} name
     * @param {string} value
     * @param {express.CookieOptions} options
     * @returns {*}
     */
    cookie(name: string, value: string, options: express.CookieOptions) {
        return attempt(() => this.res.cookie(name, value, options));
    }

    /**
     * Sends a static status message
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {StatusId} status
     * @param {?unknown} [data]
     * @param {?string} [redirect]
     * @returns {*}
     */
    sendStatus(status: StatusId | Status, data?: unknown, redirect?: string) {
        return attempt(() => {
            if (status instanceof Status) {
                return status.send(this);
            }

            const s = Status.from(
                status,
                this.req,
                JSON.stringify(bigIntEncode(data))
            );

            s.redirect = redirect || s.redirect || '';
            s.send(this);
        });
    }

    /**
     * Sends a custom status message
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {Status} status
     * @returns {*}
     */
    sendCustomStatus(status: Status) {
        return attempt(() => status.send(this));
    }

    /**
     * Renders a template
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} path
     * @param {Constructor} options
     * @returns {*}
     */
    render(path: string, options: Constructor) {
        return attempt(() => {
            this.send(render(path, options));
        });
    }

    /**
     * Streams content to the client
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @template [T=unknown]
     * @param {T[]} content
     * @returns {Result<EventEmitter<keyof StreamEventData<T>>>}
     */
    stream<T>(
        streamer: StreamInterface<T> | T[],
        pipe?: (chunk: T) => unknown
    ) {
        this.isFulfilled();
        if (Array.isArray(streamer)) {
            const em = new EventEmitter<StreamEventData<T>>();

            const stream = new ReadableStream({
                start: controller => {
                    const send = async (i: number) => {
                        if (i < streamer.length) {
                            const data = pipe
                                ? await pipe(streamer[i])
                                : streamer[i];
                            const buffer = new TextEncoder().encode(
                                JSON.stringify(data) + streamDelimiter
                            );
                            controller.enqueue(buffer);
                            setTimeout(() => send(i + 1), 100);
                            em.emit('chunk', streamer[i]);
                        } else {
                            controller.close();
                            em.emit('end', undefined);
                        }
                    };

                    send(0);
                },

                cancel() {
                    em.emit('cancel', undefined);
                },

                type: 'bytes'
            });

            this.res.write(stream);

            return em;
        } // else {
        // const stream = new ReadableStream({
        //     start: c => {
        //         // streamer.on('data', (chunk) => {
        //         //     c.enqueue(new TextEncoder().encode(
        //         //         JSON.stringify(bigIntEncode(chunk)),
        //         //     ));
        //         // });

        //         // streamer.on('end', () => c.close());
        //         // streamer.on('close', () => c.close());
        //         // streamer.on('error', (error) => c.error(error));

        //         streamer.pipe(async (chunk, i) => {
        //             const res = pipe ? await pipe(chunk) : chunk;
        //             if (!res) return; // skip empty chunks because there could be a pipe for filtering
        //             c.enqueue(
        //                 new TextEncoder().encode(
        //                     JSON.stringify(
        //                         bigIntEncode(res)
        //                     )
        //                 )
        //             );
        //         });
        //     },

        //     cancel: () => {},

        //     type: 'bytes'
        // });

        // const cache = new Set<T>();
        // let writing = true;

        streamer.on('data', async chunk => {
            // writing = this.res.write()
            // log(chunk);
            const res =
                JSON.stringify(pipe ? await pipe(chunk) : chunk) +
                streamDelimiter;
            // log(res);
            try {
                this.res.write(res);
            } catch (e) {
                // error(e);
            }
        });

        streamer.on('end', () => {
            try {
                this.isFulfilled();
                this.res.end();
            } catch (e) {
                // error(e);
            }
        });
        streamer.on('close', () => {
            try {
                this.isFulfilled();
                this.res.end();
            } catch (e) {
                // error(e);
            }
        });
        streamer.on('error', error => {
            try {
                this.isFulfilled();
                this.res.end();
            } catch {
                // throw away
            }
        });
    }

    end() {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.end();
        });
    }

    /**
     * Sends a template (similar to render)
     * @date 3/8/2024 - 6:19:36 AM
     *
     * @param {string} path
     * @param {?Constructor} [options]
     * @returns {*}
     */
    sendTemplate(path: string, options?: Constructor) {
        return attempt(() => {
            const t = getTemplateSync(path, options);

            if (t.isErr()) throw t.error;
            this.send(t.value);
        });
    }

    setHeader(name: string, value: string) {
        return attempt(() => this.res.setHeader(name, value));
    }
}
