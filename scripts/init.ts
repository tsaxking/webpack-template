import { repeatPrompt, prompt } from './prompt';
import { __root } from '../server/utilities/env';
import { runFile } from '../server/utilities/run-task';
import path from 'path';
import fs from 'fs';

const { resolve } = path;

const runPrompt = async (
    message: string,
    defaultValue?: string,
    validation?: (data: string) => boolean,
    allowBlank?: boolean
): Promise<string> => {
    if (process.argv.includes('default')) return defaultValue || '';
    if (validation) {
        const r = await repeatPrompt(
            message,
            undefined,
            validation,
            allowBlank
        );
        if (r) return r;
        return defaultValue || '';
    }
    return prompt(message + ':') || defaultValue || '';
};

const createEnv = async () => {
    const values: {
        [key: string]: string | number;
    } = {
        SESSION_DURATION: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
    };

    try {
        const file = resolve(__root, './.env');
        // const data = Deno.readTextFileSync(file);
        const data = fs.readFileSync(file, 'utf8');
        const lines = data.split('\n');
        for (const line of lines) {
            const [key, value] = line.split('=');
            values[key.trim()] = value
                .replace(/"/g, '')
                .replace(/'/g, '')
                .trim();
        }
    } catch {
        console.warn(
            'Unable to read .env file, please make sure it exists and is formatted correctly.'
        );
    }

    const setKey = async (
        key: string,
        message: string,
        defaultValue?: string,
        validation?: (data: string) => boolean,
        allowBlank = true
    ) => {
        if (typeof values[key] !== 'undefined') return;
        const value = await runPrompt(
            message,
            defaultValue,
            validation,
            allowBlank
        );
        if (value) {
            values[key] = value;

            if (key === 'SEND_STATUS_EMAILS') {
                values[key] = values[key] === 'y' ? 'TRUE' : 'FALSE';
            }
        } else {
            values[key] = defaultValue || '';
        }
    };

    // APP
    await setKey(
        'PORT',
        'Port: (default: 3000)',
        '3000',
        i => +i > 0 && +i < 65535,
        true
    );
    await setKey(
        'SOCKET_PORT',
        'Session Port: (default: 3001)',
        '3001',
        i => +i > 0 && +i < 65535,
        true
    );
    await setKey(
        'ENVIRONMENT',
        'Environment: (default: dev)',
        'dev',
        i => ['dev', 'prod'].includes(i),
        true
    );
    await setKey(
        'DOMAIN',
        'Domain: (default: localhost)',
        'http://localhost:' + values['PORT'],
        i => i.length > 0,
        true
    );
    await setKey(
        'SOCKET_DOMAIN',
        'Socket Domain: (default: localhost)',
        'http://localhost:' + values['SOCKET_PORT'],
        i => i.length > 0,
        true
    );
    await setKey(
        'TITLE',
        'Title: (default: My App)',
        'My App',
        i => i.length > 0,
        true
    );
    await setKey(
        'AUTO_SIGN_IN',
        'Auto Sign In: (no default)',
        '',
        undefined,
        true
    );

    // API KEYS
    await setKey(
        'SENDGRID_API_KEY',
        'Sendgrid API Key: (no default)',
        '',
        undefined,
        true
    );
    await setKey(
        'SENDGRID_DEFAULT_FROM',
        'Sendgrid Default From: (no default)',
        '',
        undefined,
        true
    );
    await setKey(
        'SEND_STATUS_EMAILS',
        'Send Status Emails: (default: false) (y/n)',
        'FALSE',
        i => ['y', 'n'].includes(i),
        true
    );
    await setKey('TBA_KEY', 'TBA Key: (no default)', '', undefined, true);
    await setKey(
        'RANDOM_KEY_AUTH',
        'Random Key Auth: (no default)',
        '',
        undefined,
        true
    );
    await setKey(
        'RANDOM_KEY_LINK',
        'Random Key Link: (no default)',
        '',
        undefined,
        true
    );

    // DATABASE
    await setKey(
        'DATABASE_USER',
        'Database User: (default user)',
        'user',
        i => i.length > 0,
        true
    );
    await setKey(
        'DATABASE_PASSWORD',
        'Database Password: (default 1234)',
        '1234',
        i => i.length > 0,
        true
    );
    await setKey(
        'DATABASE_NAME',
        'Database Name: (default template1)',
        'template1',
        i => i.length > 0,
        true
    );
    await setKey(
        'DATABASE_HOST',
        'Database Host: (default localhost)',
        'localhost',
        i => i.length > 0,
        true
    );
    await setKey(
        'DATABASE_PORT',
        'Database Port: (default 5432)',
        '5432',
        i => i.length > 0,
        true
    );
    await setKey(
        'MINIFY',
        'Minify: (default: n) (y/n)',
        'n',
        i => ['y', 'n'].includes(i),
        true
    );
    await setKey(
        'RECAPTCHA_SITE_KEY',
        'Recaptcha Site Key: (no default)',
        '',
        undefined,
        true
    );
    await setKey(
        'RECAPTCHA_SECRET_KEY',
        'Recaptcha Secret Key: (no default)',
        '',
        undefined,
        true
    );

    await setKey(
        'BACKUP_DAYS',
        'Backup Days: (default: 7)',
        '7',
        i => +i > 0,
        true
    );
    await setKey(
        'BACKUP_INTERVAL',
        'Backup Interval: (in hours) (default: 24)',
        '24',
        i => +i > 0,
        true
    );

    const e = Object.keys(values)
        .map(key => `${key} = '${values[key]}'`)
        .join('\n');
    // Deno.writeTextFileSync(resolve(__root, './.env'), e);
    fs.writeFileSync(resolve(__root, './.env'), e);

    return values;
};

// if (import.meta.main) createEnv();
if (require.main) createEnv();

if (process.argv.includes('--db')) {
    (async () => {
        // this will run the database setup.
        // You cannot import DB because github actions will not have access to the database.
        const res = await runFile('/server/utilities/databases.ts', 'run');
        if (res.isOk()) console.log(res.value);
        else console.error(res.error);
    })();
}

// if (Deno.args.includes('--db')) {
//     // this will run the database setup.
//     // You cannot import DB because github actions will not have access to the database.
//     const res = await runTask('/server/utilities/databases.ts');
//     if (res.isOk()) console.log(res.value);
//     else console.error(res.error);
// }
