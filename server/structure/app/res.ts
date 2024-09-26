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
     * @param {StatusId} id
     * @param {?unknown} [data]
     * @param {?string} [redirect]
     * @returns {*}
     */
    sendStatus(id: StatusId, data?: unknown, redirect?: string) {
        return attempt(() => {
            const s = Status.from(
                id,
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
    stream<T = unknown>(
        content: T[]
    ): Result<EventEmitter<StreamEventData<T>>> {
        return attempt(() => {
            this.isFulfilled();
            const em = new EventEmitter<StreamEventData<T>>();

            const stream = new ReadableStream({
                start: controller => {
                    const send = (i: number) => {
                        if (i < content.length) {
                            const buffer = new TextEncoder().encode(
                                JSON.stringify(bigIntEncode(content[i]))
                            );
                            controller.enqueue(buffer);
                            setTimeout(() => send(i + 1), 100);
                            em.emit('chunk', content[i]);
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
