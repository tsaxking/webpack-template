import { Status } from '../utilities/status.ts';
import { NextFunction, Request, Response } from 'npm:express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { uuid } from '../utilities/uuid.ts';
import { formatBytes, createUploadsFolder } from '../utilities/files.ts';
import { __uploads } from "../utilities/env.ts";




/**
 * Description placeholder
 *
 * @typedef {FileStreamOptions}
 */
type FileStreamOptions = {
    maxFileSize?: number;
    extensions?: string[];
}


/**
 * Description placeholder
 *
 * @param {FileStreamOptions} opts
 * @returns {(req: any, res: any, next: any) => unknown}
 */
export const fileStream = (opts?: FileStreamOptions): NextFunction => {
    createUploadsFolder();

    const fn = async(req: Request, res: Response, next: NextFunction) => {
        let { maxFileSize, extensions } = opts || {};
        extensions = extensions?.map(e => e.toLowerCase()) || [];
        maxFileSize = maxFileSize || 1000000;

        const generateFileId = () => {
            return uuid() + '-' + Date.now();
        }

        let fileId = generateFileId();
        let {
            headers: {
                'x-content-type': contentType,
                'x-file-name': fileName,
                'x-file-size': fileSize,
                'x-file-type': fileType,
                'x-file-ext': fileExt,
                'x-body': body
            }
        } = req;

        contentType = contentType as string || '';
        fileName = fileName as string || '';
        fileSize = fileSize as string || '';
        fileType = fileType as string || '';
        fileExt = fileExt as string || '';

        if (maxFileSize && +fileSize > maxFileSize) {
            console.log('File size is too large', formatBytes(+fileSize), formatBytes(maxFileSize));
            return Status.from('file.tooLarge', req).send(res);
        }

        if (extensions && !extensions.includes(fileExt.toLowerCase())) {
            console.log('File type is not allowed', fileExt, extensions);
        }

        if (!fileExt.startsWith('.')) fileExt = '.' + fileExt;


        // never overwrite files
        while (fs.existsSync(path.resolve(__uploads, fileId + fileExt))) {
            fileId = generateFileId();
        }

        const file = fs.createWriteStream(path.resolve(__uploads, fileId + fileExt));

        let total = 0;
        req.on('data', (chunk: {
            length: number;
        }) => {
            file.write(chunk);
            total += chunk.length;
            console.log('Uploaded', formatBytes(total).string, formatBytes(+(fileSize || '')).string, `(${Math.round(total / +(fileSize || '') * 100)}% )`);
        });

        req.on('end', () => {
            file.end();

            req.body = body ? JSON.parse(body as string) : undefined;

            req.file = {
                id: fileId,
                name: fileName as string || '',
                size: +(fileSize as string) || 0,
                type: fileType as string || '',
                ext: fileExt as string || '',
                contentType: contentType as string || '',
                filename: fileId + fileExt
            }
            next();
        });

        req.on('error', (err: Error) => {
            console.log(err);

            res.json({
                error: 'Error uploading file: ' + fileName
            });
        });
    }

    return fn as unknown as NextFunction;
}