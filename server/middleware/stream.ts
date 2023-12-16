import { Status } from '../utilities/status.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { uuid } from '../utilities/uuid.ts';
import { formatBytes, createUploadsFolder, saveUpload } from '../utilities/files.ts';
import { __uploads } from "../utilities/env.ts";
import { Next, ServerFunction } from "../structure/app/app.ts"
import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts";
import { StatusId } from '../../shared/status-messages.ts';

/**
 * Description placeholder
 *
 * @typedef {FileStreamOptions}
 */
type FileStreamOptions = {
    maxFileSize?: number;
    extensions?: string[];
}

export type FileUpload = {
    name: string;
    id: string;
    ext: string;
    size: number;
}

/**
 * Description placeholder
 *
 * @param {FileStreamOptions} opts
 * @returns {(req: any, res: any, next: any) => unknown}
 */
export const fileStream = (opts?: FileStreamOptions): ServerFunction<any> => {
    createUploadsFolder();
    return async(req: Req, res: Res, next: Next) => {
        let { maxFileSize, extensions } = opts || {};
        extensions = extensions?.map(e => e.toLowerCase()) || [];
        maxFileSize = maxFileSize ? maxFileSize : 1024 * 1024 * 10;

        const generateFileId = () => {
            return uuid() + '-' + Date.now();
        }

        let sent: boolean = false;

        const sendStatus = (status: StatusId, data: any) => {
            if (!sent) {
                sent = true;
                res.sendStatus(status, data);
            }
        }

        const reqBody = await req.req.formData();
        const bodyStr = req.headers.get('X-Body'); // had to put body in headers because FormData is already in there
        let body: any;
        if (bodyStr) body = JSON.parse(bodyStr);
        else body = {};

        // forced to use any because Deno FormData is not typed accurately yet
        reqBody.getAll('file').forEach(async (file, i, a) => {
            if (file instanceof File) {
                const name = file.name;
                const ext = name.split('.').pop()?.toLowerCase() || '';
                const size = file.size;
    
                if ((extensions as string[]).length && !(extensions as string[]).includes(ext)) {
                    return sendStatus('files:invalid-extension', { name, ext, extensions, ...body });
                }
    
                if (size > (maxFileSize as number)) {
                    return sendStatus('files:too-large', { name, size: formatBytes(size), maxFileSize: formatBytes(maxFileSize as number), ...body });
                }
    
                let id: string;
                do {
                    id = generateFileId();
                } while (fs.existsSync(path.join(__uploads, id)));

                const buffer = new Uint8Array(await file.arrayBuffer());
                await saveUpload(id, buffer);

                req.files.push({ name, id, ext, size});
            }

            if (i === a.length - 1) {
                next();
            }
        });
    }
}