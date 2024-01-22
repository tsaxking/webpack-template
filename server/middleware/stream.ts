import * as fs from 'node:fs';
import * as path from 'node:path';
import { uuid } from '../utilities/uuid.ts';
import {
    createUploadsFolder,
    formatBytes,
    saveUpload,
} from '../utilities/files.ts';
import { __uploads } from '../utilities/env.ts';
import { Next, ServerFunction } from '../structure/app/app.ts';
import { Req } from '../structure/app/req.ts';
import { Res } from '../structure/app/res.ts';
import { StatusId } from '../../shared/status-messages.ts';
import { EventEmitter } from '../../shared/event-emitter.ts';

/**
 * Options for file upload streams
 *
 * @typedef {FileStreamOptions}
 */
type FileStreamOptions = Partial<{
    maxFileSize: number;
    extensions: string[];
    maxFiles: number;
}>;

/**
 * File upload object
 * @date 1/9/2024 - 1:21:53 PM
 *
 * @export
 * @typedef {FileUpload}
 */
export type FileUpload = {
    name: string;
    id: string;
    ext: string;
    size: number;
};

/**
 * Creates a middleware function that handles file uploads
 *
 * @param {FileStreamOptions} opts
 * @returns {(req: any, res: any, next: any) => unknown}
 */
export const fileStream = (opts?: FileStreamOptions): ServerFunction => {
    createUploadsFolder();
    return async (req: Req, res: Res, next: Next) => {
        let { maxFileSize, extensions } = opts || {};
        extensions = extensions?.map((e) => e.toLowerCase()) || [];
        maxFileSize = maxFileSize ? maxFileSize : 1024 * 1024 * 10;

        const generateFileId = () => {
            return uuid() + '-' + Date.now();
        };

        let sent = false;

        const sendStatus = (status: StatusId, data: unknown) => {
            if (!sent) {
                sent = true;
                res.sendStatus(status, data);
            }
        };

        const reqBody = await req.req.formData();
        const bodyStr = req.headers.get('X-Body'); // had to put body in headers because FormData is already in there
        let body: unknown;
        if (bodyStr) body = JSON.parse(bodyStr);
        else body = {};

        // forced to use any because Deno FormData is not typed accurately yet

        const files = reqBody.getAll('file');
        if (opts?.maxFiles && files.length > opts.maxFiles) {
            return res.sendStatus('files:too-many-files', {
                maxFiles: opts.maxFiles,
                ...(body || {}),
            });
        }

        files.forEach(async (file, i, a) => {
            if (file instanceof File) {
                const name = file.name;
                const ext = name.split('.').pop()?.toLowerCase() || '';
                const size = file.size;

                if (
                    (extensions as string[]).length &&
                    !(extensions as string[]).includes(ext)
                ) {
                    return sendStatus('files:invalid-extension', {
                        name,
                        ext,
                        extensions,
                        ...(body || {}),
                    });
                }

                if (size > (maxFileSize as number)) {
                    return sendStatus('files:too-large', {
                        name,
                        size: formatBytes(size),
                        maxFileSize: formatBytes(maxFileSize as number),
                        ...(body || {}),
                    });
                }

                let id: string;
                do {
                    id = generateFileId();
                } while (fs.existsSync(path.join(__uploads, id)));

                const buffer = new Uint8Array(await file.arrayBuffer());
                await saveUpload(id, buffer);

                req.files.push({ name, id, ext, size });
            }

            if (i === a.length - 1) {
                next();
            }
        });
    };
};

/**
 * All events that can be emitted by a stream
 * @date 1/9/2024 - 1:21:53 PM
 *
 * @typedef {StreamEvents}
 */
type StreamEvents = {
    data: string;
    end: void;
    error: Error;
};

/**
 * Event emitter
 * @date 1/9/2024 - 1:21:53 PM
 *
 * @typedef {EM}
 */
type _EM = EventEmitter<keyof StreamEvents>;

/**
 * Stream event middleware options
 * @date 1/9/2024 - 1:21:53 PM
 *
 * @typedef {StreamOptions}
 */
type StreamOptions = {
    onData: (data: string) => void;
    onEnd: () => void;
    onError: (err: Error) => void;
};

/**
 * Creates a middleware function that handles stream events
 * Be careful using this function as it can cause memory leaks if not used properly
 * This works with ServerRequest.stream() which sends a constant stream of https requests to the server
 * All this does is 'combine' the requests into one event emitter
 * @deprecated Do not use this function, it is not yet fully tested
 * @date 1/9/2024 - 1:21:53 PM
 */
export const retrieveStream = (
    options: Partial<StreamOptions>,
): ServerFunction<
    | {
        type: 'data';
        index: number;
        data: string;
        size: number;
    }
    | {
        type: 'end';
    }
    | {
        type: 'error';
        error: Error;
    }
> => {
    const cached = new Map<number, string>();

    let sentIndex = 0;
    const send = (data: string) => {
        options.onData?.(data);
        sentIndex++;

        if (cached.has(sentIndex)) {
            send(cached.get(sentIndex) as string);
            cached.delete(sentIndex);
        }
    };

    return (
        req: Req<
            | {
                type: 'data';
                index: number;
                data: string;
                size: number;
            }
            | {
                type: 'end';
            }
            | {
                type: 'error';
                error: Error;
            }
        >,
        res: Res,
    ) => {
        try {
            const { type } = req.body;
            switch (type) {
                case 'data':
                    (() => {
                        const { index, data, size: _size } = req.body;
                        if (index === sentIndex) {
                            send(data);
                        } else {
                            cached.set(index, data);
                        }

                        res.json({
                            index: sentIndex,
                            status: 'received',
                        });
                    })();
                    break;
                case 'end':
                    options.onEnd?.();
                    res.json({
                        index: sentIndex,
                        status: 'ended',
                    });
                    break;
                case 'error':
                    options.onError?.(req.body.error);
                    res.json({
                        index: sentIndex,
                        status: 'error',
                    });
                    break;
            }
        } catch (error) {
            res.json({
                index: sentIndex,
                status: 'error',
            });
        }
    };
};
