import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts"
import { Next, ServerFunction } from "../structure/app/app.ts";

type ValidateOptions = {
    allowExtra?: boolean
    onInvalid?: (key: string, value: any) => void
    onMissing?: (key: string) => void
    
    onspam?: ServerFunction
}

export const validate = (data: {
    [key: string]: (value: any) => boolean
}, options?: ValidateOptions): ServerFunction => {
    return (req: Req, res: Res, next: Next) => {
        const { body } = req;

        for (const key in data) {
            if (!data[key](body[key])) {

                if (options?.onInvalid) options.onInvalid(key, body[key])
                if (options?.onMissing && body[key] === undefined) options.onMissing(key);

                if (options?.onspam && body[key] === undefined) options.onspam(req, res, next);
                else res.sendStatus('server:invalid-data');
                return;
            }
        }

        next();
    };
}