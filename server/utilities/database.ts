import { PgDatabase, Database } from './database/databases';
import { Client } from 'pg';
import env from './env';

/**
 * The name of the main database
 * @date 1/9/2024 - 12:08:08 PM
 *
 * @type {*}
 */
const {
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT
} = env;

{
    const cannotConnect =
        'FATAL: Cannot connect to the database, please check your .env file |';

    if (!DATABASE_USER) {
        throw new Error(`${cannotConnect} DATABASE_USER is not defined`);
    }
    if (!DATABASE_PASSWORD) {
        throw new Error(`${cannotConnect} DATABASE_PASSWORD is not defined`);
    }
    if (!DATABASE_NAME) {
        throw new Error(`${cannotConnect} DATABASE_NAME is not defined`);
    }
    if (!DATABASE_HOST) {
        throw new Error(`${cannotConnect} DATABASE_HOST is not defined`);
    }
    if (!DATABASE_PORT) {
        throw new Error(`${cannotConnect} DATABASE_PORT is not defined`);
    }
}

export const DB = new Database(
    new PgDatabase(
        new Client({
            user: DATABASE_USER,
            database: DATABASE_NAME,
            host: DATABASE_HOST,
            password: DATABASE_PASSWORD,
            port: Number(DATABASE_PORT),
            keepAlive: true
        })
    )
);
