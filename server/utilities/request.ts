import axios, { AxiosRequestConfig } from 'axios';
import { attemptAsync } from '../../shared/check';

/**
 * Sends a request to the specified URL and returns the response data.
 * @date 3/8/2024 - 5:57:20 AM
 *
 * @param {string} url
 * @param {AxiosRequestConfig} [options={}]
 * @returns {*}
 */
export const request = <T = unknown>(
    url: string,
    options: AxiosRequestConfig = {}
) => {
    return attemptAsync(async () => {
        const response = await axios(url, options);
        return response.data as T;
    });
};
