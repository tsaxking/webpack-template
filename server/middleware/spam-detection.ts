// const SpamScanner = require('spamscanner');
import { validate } from 'npm:deep-email-validator';
import { App, ServerFunction, Next } from "../structure/app/app.ts";
import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts";
import { log } from "../utilities/terminal-logging.ts";
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
    onspam?: ServerFunction<any>;

    /**
     * Called when an error occurs
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    onerror?: ServerFunction<any>;

    /**
     * Whether or not to continue to the next middleware function (default: false)
     */
    goToNext?: boolean;
}

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
export const emailValidation = (keys: string[], options: Options = {}): ServerFunction<any> => {
    return (req: Req, res: Res, next: Next) => {
        const arr = keys.map(key => req.body[key]).filter(Boolean);

        if (!arr.length) return next();    

        Promise.all(arr.map(value => validate({ email: value })))
            .then((results) => {
                const valid = results.every(result => result.valid);
                if (valid) return next();
                req.body.__emailResults = results;
                if (options.onspam) return options.onspam(req, res, next);
                if (options.goToNext) next();
            })
            .catch(err => {
                if (options.onerror) return options.onerror(req, res, next);
                // console.error(err);
                next();
            });
    }
};