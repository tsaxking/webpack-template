import { ServerRequest } from './requests';

type Env = {
    [key: string]: string;
};

export const env: Promise<{
    [key: string]: string;
}> = new Promise<Env>(resolve => {
    setTimeout(() =>
        ServerRequest.post<Env>('/env').then(res => {
            if (res.isOk()) {
                resolve(res.value);
            } else {
                resolve({});
            }
        })
    );
});
