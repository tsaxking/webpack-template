import Filter from 'npm:bad-words';
import { Status } from '../utilities/status.ts';
import { NextFunction } from 'npm:express';

const filter = new Filter();


export const detect = (...keys: string[]): NextFunction => {
    const fn = (req: any, res: any, next: any) => {
        for (const key of keys) {
            if (filter.isProfane(req.body[key])) {
                return Status.from('profanity', res).send(res);
            }
        }
        next();
    }

    return fn as NextFunction;
}