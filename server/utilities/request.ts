import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { attemptAsync } from '../../shared/check';

export const request = (url: string, options: AxiosRequestConfig & {
    timeout?: number;
} = {}) => {
    return attemptAsync(() => {
        return new Promise<AxiosResponse>((res, rej) => {
            setTimeout(() => rej('Request timed out'), options.timeout || 5000);
            axios(url, options)
                .then(res)
                .catch(rej);
        });
    });
};
