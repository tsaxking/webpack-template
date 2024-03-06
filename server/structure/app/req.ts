import express from 'express';
import { App } from './app';
import { Session } from '../sessions';
import { FileUpload } from '../../middleware/stream';

type B = {
    [key: string]: unknown;
};

type FileBody = B & {
    $$files: FileUpload[];
};

export type ReqBody = B | FileBody;

export class Req<T = unknown> {
    public readonly start = Date.now();

    constructor(
        public readonly app: App,
        public readonly req: express.Request,
        public readonly session: Session
    ) {}

    public get params() {
        return this.req.params;
    }

    public get body(): T {
        return this.req.body;
    }

    public set body(value: T) {
        this.req.body = value;
    }

    public get url() {
        return this.req.url;
    }

    public get headers() {
        const map = new Map<string, string>();
        if (!this.req.headers) return map;
        for (const key in this.req.headers) {
            map.set(key, this.req.headers[key] as string);
        }

        return map;
    }

    public get method() {
        return this.req.method;
    }

    public get cookie() {
        return this.req.cookies ? this.req.cookies : {};
    }

    public get query() {
        return this.req.query;
    }

    public get ip() {
        return this.req.ip;
    }

    public get originalUrl() {
        return this.req.originalUrl;
    }

    public get pathname() {
        return this.req.path;
    }

    public get protocol() {
        return this.req.protocol;
    }

    public get secure() {
        return this.req.secure;
    }

    public get io() {
        return this.app.io;
    }

    public get files() {
        return this.req.files as Express.Multer.File[];
    }
}
