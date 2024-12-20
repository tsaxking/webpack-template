import { attemptAsync } from '../../../shared/check';
import { Blank } from '../../../shared/struct';
import { DB } from '../../utilities/database';
import { uuid } from '../../utilities/uuid';
import { ServerFunction } from '../app/app';
import { Struct } from './struct';

export namespace API {
    export const Keys = new Struct({
        database: DB,
        structure: {
            // ID is the key for the API key
            name: 'text',
            url: 'text', // domain/path to send requests to
            structs: 'text' // comma-separated list of structs to allow access to
        },
        generators: {
            id: () => (uuid() + uuid() + uuid() + uuid()).replace(/-/g, '')
        },
        name: 'ApiKeys'
    });

    export const requireKey =
        (name: string): ServerFunction =>
        async (req, res, next) => {
            const key = req.headers.get(name);
            if (!key)
                return res.status(401).json({ error: 'API key required' });

            const api = (await Keys.fromId(key)).unwrap();
            if (!api) return res.status(401).json({ error: 'Invalid API key' });

            next();
        };

    export const canAccess = (key: string, struct: Struct<Blank, string>) => {
        return attemptAsync(async () => {
            const api = (await Keys.fromId(key)).unwrap();
            if (!api) return false;
            return api.data.structs.split(',').includes(struct.name);
        });
    };
}
