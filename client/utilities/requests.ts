import { capitalize, toSnakeCase, fromCamelCase, fromSnakeCase } from "../../shared/text.ts";
import { sleep } from "../../shared/sleep.ts";
import { StatusJson } from "../../shared/status.ts";
import CBS from "../submodules/custom-bootstrap/src/1-main/1-main.ts";
import { CBS_Color } from "../submodules/custom-bootstrap/src/1-main/enums.ts";


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


export class ServerRequest {
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

    static async post(url: string, body?: any, options?: RequestOptions): Promise<any> {
        const r = new ServerRequest(url, 'post', body, options);
        return r.send();
    }


    static async get(url: string, options?: RequestOptions): Promise<any> {
        const r = new ServerRequest(url, 'get', undefined, options);
        return r.send();
    }

    static async multiple(requests: ServerRequest[]): Promise<any[]> {
        return Promise.all(requests.map((r) => r.send()));
    }


    static async stream(url: string, files: FileList, body?: any, options?: StreamOptions): Promise<void> {
        return new Promise(async (res, rej) => {
            if (typeof url !== 'string') 
                return res(
                    console.error(
                        new Error('Url must be a string. Received ' + typeof url)));
    
    
            if (!files) return console.error(new Error('No files found'));
                
            if (!(files instanceof FileList)) 
                return res(
                    console.error(
                        new Error('fileInput must be a FileList. Received ' + files)));
    
            
    
            const streamFile = async (index: number) => {
                const file = files[index];
                if (!file) return res(); // last file completed
    
                let filename = file.name.split('.').shift() || '';
    
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                xhr.setRequestHeader('X-File-Name', filename);
                xhr.setRequestHeader('X-File-Size', file.size.toString());
                xhr.setRequestHeader('X-File-Type', file.type);
                xhr.setRequestHeader('X-File-Index', index.toString());
                xhr.setRequestHeader('X-File-Count', files.length.toString());
                xhr.setRequestHeader('X-File-Name', file.name);
                xhr.setRequestHeader('X-File-Ext', file.name.split('.').pop() || '');
    
                if (options?.headers) {
                    for (const key in options.headers) {
                        xhr.setRequestHeader('X-Custom-' + key, options.headers[key]);
                    }
                }

                if (body) {
                    xhr.setRequestHeader('X-Body', JSON.stringify(body));
                }
    
                // when done, do next file
                xhr.onload = (e) => streamFile(index + 1);
                xhr.onerror = rej;
    
                xhr.upload.onprogress = (e) => {
                    // TODO: progress bar logic
                }
    
                // TODO: notification logic
                xhr.onreadystatechange = (e) => {
                    if (xhr.readyState == 4) {
                        try {
                            // get the response
                            const response = JSON.parse(xhr.responseText);
                            if (response.status) {
                                // this is a notification
                                ServerRequest.notify(response);
                            }
                        } catch (e) {
    
                        }
                    }
                }
    
                xhr.send(file);
            }
    
            streamFile(0);
        });
    }

    public response?: any;
    public initTime: number = Date.now();
    public error?: Error;
    public sent: boolean = false;
    public duration?: number;

    constructor(
        public readonly url: string,
        public readonly method: 'get' | 'post' = 'post',
        public readonly body?: any,
        public readonly options?: RequestOptions
    ) {
        ServerRequest.all.push(this);
    }



    async send(): Promise<any> {
        return new Promise((res, rej) => {
            try {
                JSON.stringify(this.body);
            } catch {
                throw new Error('Body must be able to be parsed as JSON');
            }
            const start = Date.now();
            this.sent = true;

            if (this.options?.cached) {
                const req = ServerRequest.all.findLast((r) => r.url == this.url);
                if (req) {
                    this.duration = Date.now() - start;
                    this.response = req.response;
                    return res(req.response);
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
                    console.log(data);

                    if (data?.status) {
                        // this is a notification
                        ServerRequest.notify(data);
                    }


                    this.duration = Date.now() - start;
                    this.response = data;

                    if (data?.redirect) {
                        if (typeof data.sleep !== 'number') data.sleep = 1000;
                        await sleep(data.sleep);
                        location.href = data.redirect;
                    }
                    res(data);
                })
                .catch((e) => {
                    this.duration = Date.now() - start;
                    this.error = new Error(e);
                    rej(e);
                });
        });
    }

    private static notify(data: StatusJson) {
        const status = capitalize(fromCamelCase(data.title));

        let message = `${status}: ${data.message}`;

        if(data.data) {
            for (const [key, value] of Object.entries(data.data)) {
                message += `\n${key}: ${value}`;
            }
        }

        const t = CBS.createElement('toast', {
            dismiss: 5000,
            title: data.title,
            body: message,
            color: data.status as CBS_Color
        });

        switch(data.status) {
            case 'danger':
            case 'success':
                t.subcomponents.body.addClass('text-light');
                break;
            default:
                t.subcomponents.body.addClass('text-dark');
                break;
        }

        t.show();
    }
}