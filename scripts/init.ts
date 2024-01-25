import { init } from '../storage/db/scripts/init.ts';
import { repeatPrompt } from './prompt.ts';
import { __root, resolve } from '../server/utilities/env.ts';

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
    setKey('AUTO_SIGN_IN', 'Auto Sign In: (no default)', '', undefined, true);
    setKey('TBA_KEY', 'TBA Key: (no default)', '', undefined, true);
    setKey(
        'DATABASE_LINK',
        'Database Link: (default: main)',
        'main',
        (i) => i.length > 0,
        true,
    );
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

    const e = Object.keys(values)
        .map((key) => `${key} = '${values[key]}'`)
        .join('\n');
    Deno.writeTextFileSync(resolve(__root, './.env'), e);

    return values;
};

// const _createEnv = () => {
//     if (
//         Deno.args.includes('--no-env') ||
//         fs.existsSync(resolve(__root, './.env'))
//     ) {
//         log('Skipping .env file creation...');
//         return {
//             databaseLink: 'main',
//         };
//     }
//     log('Creating .env file...');
//     const values: {
//         [key: string]: string | number | boolean | null | undefined;
//     } = {
//         session_duration: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
//     };

//     values.port = runPrompt(
//         'Port: (default: 3000)',
//         '3000',
//         (i) => +i > 0 && +i < 65535,
//         true,
//     );
//     values.sessionPort = +values.port + 1;
//     values.environment = runPrompt(
//         'Environment: (default: dev)',
//         'dev',
//         (i) => ['dev', 'prod'].includes(i),
//         true,
//     );
//     values.domain = runPrompt(
//         'Domain: (default: localhost)',
//         'http://localhost:' + values.port,
//         (i) => i.length > 0,
//         true,
//     );
//     values.socketDomain = runPrompt(
//         'Socket Domain: (default: localhost)',
//         'http://localhost:' + values.sessionPort,
//         (i) => i.length > 0,
//         true,
//     );
//     values.title = runPrompt(
//         'Title: (default: My App)',
//         'My App',
//         (i) => i.length > 0,
//         true,
//     );
//     values.sendgridApiKey = runPrompt(
//         'Sendgrid API Key: (no default)',
//         '',
//         undefined,
//         true,
//     );
//     values.sendgridDefaultFrom = runPrompt(
//         'Sendgrid Default From: (no default)',
//         '',
//         undefined,
//         true,
//     );
//     values.sendStatusEmails = runPrompt(
//             'Send Status Emails: (default: false) (y/n)',
//             'false',
//             (i) => ['y', 'n'].includes(i),
//             true,
//         ) === 'y'
//         ? 'TRUE'
//         : 'FALSE';
//     values.autoSignIn = runPrompt(
//         'Auto Sign In: (no default)',
//         '',
//         undefined,
//         true,
//     );
//     values.tbaKey = runPrompt('TBA Key: (no default)', '', undefined, true);
//     values.databaseLink = runPrompt(
//         'Database Link: (default: main)',
//         'main',
//         (i) => i.length > 0,
//         true,
//     );
//     values.randomKeyAuth = runPrompt(
//         'Random Key Auth: (no default)',
//         '',
//         undefined,
//         true,
//     );
//     values.randomKeyLink = runPrompt(
//         'Random Key Link: (no default)',
//         '',
//         undefined,
//         true,
//     );

//     const e = Object.keys(values)
//         .map(
//             (key) =>
//                 `${toSnakeCase(fromCamelCase(key)).toUpperCase()} = '${
//                     values[key]
//                 }'`,
//         )
//         .join('\n');
//     Deno.writeTextFileSync(resolve(__root, './.env'), e);

//     return values;
// };

const vals = createEnv();

init(vals['DATABASE_LINK'] as string);
