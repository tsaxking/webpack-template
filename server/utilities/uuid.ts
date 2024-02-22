// The point of this file is to work with another server that generates ids and pulls them form random.org

import * as randomString from 'npm:uuid';
import env from './env.ts';
import { attemptAsync, Result } from '../../shared/check.ts';
import { getJSON, saveJSON } from './files.ts';

// limit 5 keys in cache at a time
let cache: string[] = [];

const res = await getJSON<string[]>('cached-ids');

if (res.isOk()) cache = res.value;

const retrieve = async (): Promise<Result<string[]>> => {
    return attemptAsync(async () => {
        if (!env.RANDOM_KEY_LINK) {
            throw new Error('No random key link provided');
        }
        const data = await fetch(env.RANDOM_KEY_LINK + '/uuid', {
            headers: {
                'x-auth-token': env.RANDOM_KEY_AUTH || '',
            },
            method: 'POST',
        });

        if (data.ok) {
            // console.log('Retrieved keys!');
            const json = await data.json();

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
    return randomString.v4();
};
