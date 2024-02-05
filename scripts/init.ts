import { repeatPrompt } from './prompt.ts';
import { __root, resolve } from '../server/utilities/env.ts';
import { runTask } from '../server/utilities/run-task.ts';

const runPrompt = (
    message: string,
    defaultValue?: string,
    validation?: (data: string) => boolean,
    allowBlank?: boolean,
): string => {
    if (Deno.args.includes('--default')) return defaultValue || '';
    if (validation) {
        const r = repeatPrompt(message, undefined, validation, allowBlank);
        if (r) return r;
        else return defaultValue || '';
    }
    const r = prompt(message + ':') || defaultValue || '';
    return r;
};

const createEnv = () => {
    const values = {
        SESSION_DURATION: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
    };

    try {
        const file = resolve(__root, './.env');
        const data = Deno.readTextFileSync(file);
        const lines = data.split('\n');
        for (const line of lines) {
            const [key, value] = line.split('=');
            values[key.trim()] = value
                .replace(/"/g, '')
                .replace(/'/g, '')
                .trim();
        }
    } catch {
        console.error(
            'Unable to read .env file, please make sure it exists and is formatted correctly.',
        );
    }

    const setKey = (
        key: string,
        message: string,
        defaultValue?: string,
        validation?: (data: string) => boolean,
        allowBlank = true,
    ) => {
        if (typeof values[key] !== 'undefined') return;
        const value = runPrompt(message, defaultValue, validation, allowBlank);
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
    setKey(
        'PORT',
        'Port: (default: 3000)',
        '3000',
        (i) => +i > 0 && +i < 65535,
        true,
    );
    setKey(
        'SOCKET_PORT',
        'Session Port: (default: 3001)',
        '3001',
        (i) => +i > 0 && +i < 65535,
        true,
    );
    setKey(
        'ENVIRONMENT',
        'Environment: (default: dev)',
        'dev',
        (i) => ['dev', 'prod'].includes(i),
        true,
    );
    setKey(
        'DOMAIN',
        'Domain: (default: localhost)',
        'http://localhost:' + values['PORT'],
        (i) => i.length > 0,
        true,
    );
    setKey(
        'SOCKET_DOMAIN',
        'Socket Domain: (default: localhost)',
        'http://localhost:' + values['SOCKET_PORT'],
        (i) => i.length > 0,
        true,
    );
    setKey(
        'TITLE',
        'Title: (default: My App)',
        'My App',
        (i) => i.length > 0,
        true,
    );
    setKey('AUTO_SIGN_IN', 'Auto Sign In: (no default)', '', undefined, true);

    // API KEYS
    setKey(
        'SENDGRID_API_KEY',
        'Sendgrid API Key: (no default)',
        '',
        undefined,
        true,
    );
    setKey(
        'SENDGRID_DEFAULT_FROM',
        'Sendgrid Default From: (no default)',
        '',
        undefined,
        true,
    );
    setKey(
        'SEND_STATUS_EMAILS',
        'Send Status Emails: (default: false) (y/n)',
        'FALSE',
        (i) => ['y', 'n'].includes(i),
        true,
    );
    setKey('TBA_KEY', 'TBA Key: (no default)', '', undefined, true);
    setKey(
        'RANDOM_KEY_AUTH',
        'Random Key Auth: (no default)',
        '',
        undefined,
        true,
    );
    setKey(
        'RANDOM_KEY_LINK',
        'Random Key Link: (no default)',
        '',
        undefined,
        true,
    );

    // DATABASE
    setKey(
        'DATABASE_USER',
        'Database User: (default user)',
        'user',
        (i) => i.length > 0,
        true,
    );
    setKey(
        'DATABASE_PASSWORD',
        'Database Password: (default 1234)',
        '1234',
        (i) => i.length > 0,
        true,
    );
    setKey(
        'DATABASE_NAME',
        'Database Name: (default template1)',
        'template1',
        (i) => i.length > 0,
        true,
    );
    setKey(
        'DATABASE_HOST',
        'Database Host: (default localhost)',
        'localhost',
        (i) => i.length > 0,
        true,
    );
    setKey(
        'DATABASE_PORT',
        'Database Port: (default 5432)',
        '5432',
        (i) => i.length > 0,
        true,
    );

    const e = Object.keys(values)
        .map((key) => `${key} = '${values[key]}'`)
        .join('\n');
    Deno.writeTextFileSync(resolve(__root, './.env'), e);

    return values;
};

createEnv();

if (Deno.args.includes('--db')) {
    // this will run the database setup.
    // You cannot import DB because github actions will not have access to the database.
    const res = await runTask('/server/utilities/databases.ts');
    if (res.isOk()) console.log(res.value);
    else console.error(res.error);
}
