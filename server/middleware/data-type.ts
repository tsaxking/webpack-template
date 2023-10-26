import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts"
import { Next, ServerFunction } from "../structure/app/app.ts";
import { Colors } from "../utilities/colors.ts";

type ValidateOptions = {
    allowExtra?: boolean
    onInvalid?: (key: string, value: any) => void
    onMissing?: (key: string) => void
    
    onspam?: ServerFunction<any>
}

export const validate = (data: {
    [key: string]: (value: any) => boolean
}, options?: ValidateOptions): ServerFunction<any> => {
    return (req: Req, res: Res, next: Next) => {
        const { body } = req;

        for (const key in data) {
            if (body[key] === undefined) {
                if (options?.onMissing) options.onMissing(key);
                else console.log('Missing data:', key, body[key]);
                continue;
            }

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