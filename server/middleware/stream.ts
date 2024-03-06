import { createUploadsFolder } from '../utilities/files';
import { __uploads } from '../utilities/env';
import { ServerFunction } from '../structure/app/app';
import { Req } from '../structure/app/req';
import { Res } from '../structure/app/res';
import { EventEmitter } from '../../shared/event-emitter';
import multer from 'multer';

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

    const upload = multer({
        dest: __uploads,
        limits: {
            fileSize: opts?.maxFileSize,
            files: opts?.maxFiles
        }
    });

    return async (req, res, next) => {
        const { files } = req;
        if (!files) {
            return res.sendStatus('files:missing');
        }

        if (files.length > (opts?.maxFiles ?? 1)) {
            return res.sendStatus('files:too-many');
        }

        if (opts?.extensions) {
            for (const file of files) {
                if (!opts.extensions.includes(file.mimetype)) {
                    return res.sendStatus('files:invalid-extension');
                }
            }
        }

        upload.array('files', opts?.maxFiles ?? 1)(req.req, res.res, next);
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
    options: Partial<StreamOptions>
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
        res: Res
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
                            status: 'received'
                        });
                    })();
                    break;
                case 'end':
                    options.onEnd?.();
                    res.json({
                        index: sentIndex,
                        status: 'ended'
                    });
                    break;
                case 'error':
                    options.onError?.(req.body.error);
                    res.json({
                        index: sentIndex,
                        status: 'error'
                    });
                    break;
            }
        } catch (error) {
            res.json({
                index: sentIndex,
                status: 'error'
            });
        }
    };
};
