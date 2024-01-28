import { ServerRequest } from "./requests";

export const env: {
    [key: string]: string;
} = {};

ServerRequest.post('/env')
    .then((res) => {
        if (res.isOk()) {
            Object.assign(env, res.value);
        }
    });