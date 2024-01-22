import Filter from 'npm:bad-words';
import { ServerFunction } from '../structure/app/app.ts';

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
            if (filter.isProfane(req.body ? req.body[key] : '')) {
                return res.sendStatus('profanity');
            }
        }
        next();
    };
};
