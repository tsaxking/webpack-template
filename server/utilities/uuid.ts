// The point of this file is to work with another server that generates ids and pulls them form random.org

import { v4 as randomString } from 'uuid';
import env from './env';
import { attemptAsync, Result } from '../../shared/check';
import { getJSON, saveJSON } from './files';
import { request } from './request';

// limit 5 keys in cache at a time
/**
 * Current cache of keys (5 at a time)
 * @date 3/8/2024 - 5:59:41 AM
 *
 * @type {string[]}
 */
let cache: string[] = [];

getJSON<string[]>('cached-ids').then(res => {
    if (res.isOk()) cache = res.value;
});

/**
 * Retrieves a new set of keys from the server
 * @date 3/8/2024 - 5:59:41 AM
 *
 * @async
 * @returns {Promise<Result<string[]>>}
 */
const retrieve = async (): Promise<Result<string[]>> => {
    return attemptAsync(async () => {
        if (!env.RANDOM_KEY_LINK) {
            throw new Error('No random key link provided');
        }
        const data = await request(env.RANDOM_KEY_LINK + '/uuid', {
            headers: {
                'x-auth-token': env.RANDOM_KEY_AUTH || ''
            },
            method: 'POST'
        });

        if (data.isOk()) {
            // console.log('Retrieved keys!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json = (await (data.value as any).json()) as string[];

            if (!Array.isArray(json)) {
                throw new Error('Failed to retrieve keys, invalid response');
            }

            cache = json;
            const res = await saveJSON('cached-ids', json);

            if (res.isErr()) {
                // console.error('Failed to save cached ids');
            }

            return json as string[];
        }

        throw new Error('Failed to retrieve keys');
    });
};

/**
 * Returns a new UUID
 * @date 3/8/2024 - 5:59:41 AM
 *
 * @returns {string}
 */
export const uuid = (): string => {
    setTimeout(async () => {
        if (cache.length === 0) {
            const result = await retrieve();
            if (result.isOk()) {
                cache.push(...result.value);
            }
        }
    });

    if (cache.length) return cache.pop() as string;
    return randomString();
};
