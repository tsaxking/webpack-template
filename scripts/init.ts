import { init } from "../storage/db/scripts/init.ts";
import { repeatPrompt } from "./prompt.ts";
import { toSnakeCase } from "../shared/text.ts";
import { log, error } from "../server/utilities/terminal-logging.ts";
import path from 'node:path';
import fs from 'node:fs';
import env, { __root } from "../server/utilities/env.ts";


const runPrompt = (message: string, defaultValue?: string, validation?: (data: string) => boolean, allowBlank?: boolean): string => {
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
    if (Deno.args.includes('--no-env') || fs.existsSync(path.resolve(__root, './.env'))) {
        log('Skipping .env file creation...');
        return {
            databaseLink: 'main'
        };
    }
    log('Creating .env file...');
    const values: {
        [key: string]: string | number | boolean | null | undefined;
    } = {
        session_duration: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
    }

    values.port = runPrompt('Port: (default: 3000)', '3000', (i) => +i > 0 && +i < 65535, true);
    values.sessionPort = +values.port + 1;
    values.environment = runPrompt('Environment: (default: dev)', 'dev', (i) => ['dev', 'prod'].includes(i), true);
    values.domain = runPrompt('Domain: (default: localhost)', 'http://localhost:' + values.port, (i) => i.length > 0, true);
    values.socketDomain = runPrompt('Socket Domain: (default: localhost)', 'http://localhost:' + values.sessionPort, (i) => i.length > 0, true);
    values.title = runPrompt('Title: (default: My App)', 'My App', (i) => i.length > 0, true);
    values.sendgridApiKey = runPrompt('Sendgrid API Key: (no default)', '', undefined, true);
    values.sendgridDefaultFrom = runPrompt('Sendgrid Default From: (no default)', '', undefined, true);
    values.sendStatusEmails = runPrompt('Send Status Emails: (default: false) (y/n)', 'false', (i) => ['y', 'n'].includes(i), true) === 'y' ? 'TRUE' : 'FALSE';
    values.autoSignIn = runPrompt('Auto Sign In: (no default)', '', undefined, true);
    values.tbaKey = runPrompt('TBA Key: (no default)', '', undefined, true);
    values.databaseLink = runPrompt('Database Link: (default: main)', 'main', (i) => i.length > 0, true);

    Object.assign(env, values);

    const e = Object.keys(values).map((key) => `${toSnakeCase(key).toUpperCase()} = '${values[key]}'`).join('\n');
    Deno.writeTextFileSync(
        path.resolve(
            __root,
            './.env'
        ),
        e
    );

    

    return values;
}

const vals = createEnv();

init(vals.databaseLink as string);