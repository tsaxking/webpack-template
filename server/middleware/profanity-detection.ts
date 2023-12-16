import Filter from 'npm:bad-words';
import { Status } from '../utilities/status.ts';
import { Next, ServerFunction } from "../structure/app/app.ts";
import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts";

const filter = new Filter();


export const detect = (...keys: string[]): ServerFunction<any> => {
    return (req: Req, res: Res, next: Next) => {
        for (const key of keys) {
            if (filter.isProfane(req.body[key])) {
                return res.sendStatus('profanity');
            }
        }
        next();
    }
}