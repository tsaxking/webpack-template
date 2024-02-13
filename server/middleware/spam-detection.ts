// const SpamScanner = require('spamscanner');
import { validate } from 'npm:deep-email-validator';
import { ServerFunction } from '../structure/app/app.ts';
/**
 * Options for the spam detection middleware
 * @date 1/9/2024 - 1:19:48 PM
 *
 * @export
 * @typedef {Options}
 */
export type Options = {
    /**
     * Called when the request is flagged as spam
     * @param req
     * @param res
     * @param next
     * @returns
     */
    onspam?: ServerFunction;

    /**
     * Called when an error occurs
     * @param req
     * @param res
     * @param next
     * @returns
     */
    onerror?: ServerFunction;

    /**
     * Whether or not to continue to the next middleware function (default: false)
     */
    goToNext?: boolean;
};

// export const detectSpam = (keys: string[], options: Options = {}): NextFunction => {
//         const fn = (req: Request, res: Response, next: NextFunction) => {
//         const arr = keys.map(key => req.body[key]);

//         if (!arr.length) return next();
//         const scanner = new SpamScanner();

//         Promise.all(arr.map(value => scanner.scan(value)))
//             .then(results => {
//                 const isSpam = results.some(result => result.is_spam);

//                 if (isSpam) {
//                     req.body.__spamResults = results;
//                     if (options.onspam) return options.onspam(req, res, next);
//                     if (options.goToNext) next();
//                     return;
//                 }

//                 next();
//             })
//             .catch(err => {
//                 console.log(err);
//                 if (options.onerror) options.onerror(req, res, next);
//             })
//     }

//     return fn as NextFunction;
// };

/**
 * Ensures that the specified keys are valid emails
 * @date 1/9/2024 - 1:19:48 PM
 */
export const emailValidation = (
    keys: string[],
    options: Options = {},
): ServerFunction => {
    return (req, res, next) => {
        const arr = keys
            .map((key) => (req.body ? req.body[key] : ''))
            .filter(Boolean);

        if (!arr.length) return next();

        Promise.all(
            arr.map(async (value) => {
                if (typeof value !== 'string') return { valid: false };
                return validate({ email: value });
            }),
        )
            .then((results) => {
                const valid = results.every((result) => result.valid);
                if (valid) return next();
                if (options.onspam) return options.onspam(req, res, next);
                if (options.goToNext) next();
            })
            .catch((_err) => {
                if (options.onerror) return options.onerror(req, res, next);
                // console.error(err);
                next();
            });
    };
};




/**
 * Looks for a honeypot field in the request body (a field that should be empty, but a bot would fill in)
 * If the field is not empty, the request is flagged as spam, and the session is blacklisted
 * @date 2/12/2024 - 3:54:19 PM
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const honeypot = (key: string): ServerFunction<any> => {
    return (req, _res, next) => {
        if (Object.hasOwnProperty.call(req.body, key)) {
            if (req.body[key] !== '' || req.body[key] !== null || req.body[key] !== undefined) {
                // this is spam
                req.session.blacklist('honeypot');
                req.end();
            } else {
                next();
            }
        } else {
            next();
        }
    }
};