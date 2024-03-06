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

export class Res {
    public fulfilled = false;
    public _status: StatusCode = 200;

    constructor(
        public readonly app: App,
        public readonly res: express.Response,
        public readonly req: Req
    ) {}

    private isFulfilled() {
        if (this.fulfilled) {
            throw new Error('Response already fulfilled');
        }
        this.fulfilled = true;
        return false;
    }

    json(data: unknown) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.json(data);
        });
    }

    send(data: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.send(data);
        });
    }

    sendFile(path: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.sendFile(path);
        });
    }

    status(code: StatusCode) {
        this._status = code;
        return this.res.status(code);
    }

    redirect(path: string) {
        return attempt(() => {
            if (!this.isFulfilled()) this.res.redirect(path);
        });
    }

    cookie(name: string, value: string, options: express.CookieOptions) {
        return attempt(() => this.res.cookie(name, value, options));
    }

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

    sendCustomStatus(status: Status) {
        return attempt(() => status.send(this));
    }

    render(path: string, options: Constructor) {
        return attempt(() => {
            this.send(render(path, options));
        });
    }

    stream<T = unknown>(
        content: T[]
    ): Result<EventEmitter<keyof StreamEventData<T>>> {
        return attempt(() => {
            this.isFulfilled();
            const em = new EventEmitter<keyof StreamEventData<T>>();

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
                            em.emit('end');
                        }
                    };

                    send(0);
                },

                cancel() {
                    em.emit('cancel');
                },

                type: 'bytes'
            });

            this.res.write(stream);

            return em;
        });
    }

    sendTemplate(path: string, options?: Constructor) {
        return attempt(() => {
            const t = getTemplateSync(path, options);

            if (t.isErr()) throw t.error;
            this.send(t.value);
        });
    }
}
