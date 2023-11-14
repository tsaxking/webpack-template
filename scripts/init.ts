import { init } from "../storage/db/scripts/init.ts";
import { repeatPrompt } from "./prompt.ts";
import { toSnakeCase } from "../shared/text.ts";
import { log } from "../server/utilities/terminal-logging.ts";
import { env as ENV } from "node:process";
import path from 'node:path';
import fs from 'node:fs';
import { __root } from "../server/utilities/env.ts";



const runPrompt = (message: string, defaultValue?: string, validation?: (data: string) => boolean): string => {
    if (Deno.args.includes('--default')) return defaultValue || '';
    if (validation) return repeatPrompt(message, undefined, validation);
    return prompt(message + ':') || defaultValue || '';
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

    values.port = runPrompt('Port: (default: 3000)', '3000', (i) => +i > 0 && +i < 65535);
    values.sessionPort = +values.port + 1;
    values.environment = runPrompt('Environment: (default: dev)', 'dev', (i) => ['dev', 'prod'].includes(i));
    values.domain = runPrompt('Domain: (default: localhost)', 'http://localhost:' + values.port);
    values.socketDomain = runPrompt('Socket Domain: (default: localhost)', 'http://localhost:' + values.sessionPort);
    values.title = runPrompt('Title: (default: My App)', 'My App', (i) => i.length > 0);
    values.sendgridApiKey = runPrompt('Sendgrid API Key: (no default)', '');
    values.sendgridDefaultFrom = runPrompt('Sendgrid Default From: (no default)', '');
    values.sendStatusEmails = runPrompt('Send Status Emails: (default: false) (y/n)', 'false', (i) => ['y', 'n'].includes(i)) === 'y' ? 'TRUE' : 'FALSE';
    values.autoSignIn = runPrompt('Auto Sign In: (no default)', '');
    values.tbaKey = runPrompt('TBA Key: (no default)', '');
    values.databaseLink = runPrompt('Database Link: (default: main)', 'main', (i) => i.length > 0);

    Object.assign(ENV, values);

    const env = Object.keys(values).map((key) => `${toSnakeCase(key).toUpperCase()} = '${values[key]}'`).join('\n');
    Deno.writeTextFileSync(
        '../.env',
        env
    );

    return values;
}

const vals = createEnv();

init(vals.databaseLink as string);