import Filter from 'npm:bad-words';
import { Status } from '../utilities/status.ts';
import { Next, ServerFunction } from '../structure/app/app.ts';
import { Req } from '../structure/app/req.ts';
import { Res } from '../structure/app/res.ts';

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
export const detect = (...keys: string[]): ServerFunction<any> => {
    return (req: Req, res: Res, next: Next) => {
        for (const key of keys) {
            if (filter.isProfane(req.body[key])) {
                return res.sendStatus('profanity');
            }
        }
        next();
    };
};
