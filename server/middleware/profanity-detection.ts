import Filter from 'bad-words';
import { ServerFunction } from '../structure/app/app';

/**
 * Bad word filter
 * @date 1/9/2024 - 1:19:08 PM
 *
 * @type {*}
 */
const filter = new Filter();

/**
 * Returns a middleware function that checks if the body keys contain profanity
 * @date 1/9/2024 - 1:19:08 PM
 */
export const detect = (...keys: string[]): ServerFunction => {
    return (req, res, next) => {
        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (filter.isProfane(req.body ? (req.body as any)[key] : '')) {
                return res.sendStatus('profanity:detected');
            }
        }
        next();
    };
};
