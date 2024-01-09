import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts"
import { Next, ServerFunction } from "../structure/app/app.ts";
import { Colors } from "../utilities/colors.ts";

/**
 * Options for the validate function
 * @date 1/9/2024 - 1:16:19 PM
 *
 * @typedef {ValidateOptions}
 */
type ValidateOptions = {
    allowExtra?: boolean
    
    /**
     * Called when a value is invalid
     * @param key 
     * @param value 
     * @returns 
     */
    onInvalid?: (key: string, value: any) => void

    /**
     * Called when a value is missing
     * @param key 
     * @returns 
     */
    onMissing?: (key: string) => void
    
    /**
     * Called when a value is missing or is flagged as spam
     * 
     * The flagging system is not yet implemented
     */
    onspam?: ServerFunction<any>
}

/**
 * Creates a middleware function that validates the req.body, ensuring that all data is both present and the correct type
 * @date 1/9/2024 - 1:16:19 PM
 */
export const validate = (data: {
    [key: string]: (value: any) => boolean
}, options?: ValidateOptions): ServerFunction<any> => {
    return (req: Req, res: Res, next: Next) => {
        const { body } = req;

        for (const key in data) {
            if (!data[key](body[key])) {
                if (options?.onInvalid) options.onInvalid(key, body[key])
                if (options?.onMissing && body[key] === undefined) options.onMissing(key);


                if (options?.onspam && body[key] === undefined) options.onspam(req, res, next);
                else res.sendStatus('server:invalid-data');

                if (!options?.onInvalid && !options?.onMissing) {
                    console.log(`Error on ${req.method} request: ${req.url}`, `${Colors.FgRed}[Data Validation]${Colors.Reset} Invalid data: { "${Colors.FgCyan}${key}${Colors.Reset}" = "${Colors.FgYellow}${body[key]}${Colors.Reset}" } (${Colors.FgGreen}${typeof body[key]}${Colors.Reset})`);
                }

                return;
            }
        }

        next();
    };
}