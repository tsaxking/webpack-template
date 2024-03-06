import { ServerRequest } from './requests';

export const env: {
    [key: string]: string;
} = {};

setTimeout(() =>
    ServerRequest.post('/env').then(res => {
        if (res.isOk()) {
            Object.assign(env, res.value);
            Object.assign(window, {
                __env: env
            });
        }
    })
);
