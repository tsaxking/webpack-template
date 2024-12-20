import { ServerFunction } from '../structure/app/app';
import env from '../utilities/env';

export const isEnv = (...desired: string[]): ServerFunction => {
    return (_req, _res, next) => {
        if (!env.ENVIRONMENT) throw new Error('Environment not set');
        if (desired.includes(env.ENVIRONMENT)) return next();
        throw new Error('Invalid environment');
    };
};
