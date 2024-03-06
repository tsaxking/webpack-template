import axios, { AxiosRequestConfig } from 'axios';
import { attemptAsync } from '../../shared/check';

export const request = (url: string, options: AxiosRequestConfig = {}) => {
    return attemptAsync(async () => {
        const response = await axios(url, options);
        return response.data;
    });
};
