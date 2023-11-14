import path from 'npm:path';
import callsite from 'npm:callsite';
import { Colors } from "./colors.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";


/**
 * Root directory of the project
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __root: string = (() => {
    switch (os.platform()) {
        case 'linux':
            return new URL('../../', import.meta.url).pathname;
        case 'windows':
            return new URL('../../', import.meta.url).pathname.substring(1);
        default:
            throw new Error('Unsupported platform: ' + os.platform());
    }
})();

/**
 * Uploads directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __uploads: string = path.resolve(__root, './storage/uploads/');

/**
 * Logs directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __logs: string = path.resolve(__root, './storage/logs/');

/**
 * Templates directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __templates: string = path.resolve(__root, './public/templates/');

/**
 * Directory of the file that called this function
 * @date 10/12/2023 - 3:24:39 PM
 */
export const dirname = () => {
    const site = callsite()[2];
    return './' + path.relative(__root, site.getFileName().replace('file:', ''));
}



/**
 * Environment variables
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
const env: {
    [key: string]: string | undefined;
} = Deno.env.toObject();

console.log(Colors.FgGreen, 'Loading environment variables...', Colors.Reset);

if (Object.keys(env).length === 56) {
    console.log(Colors.FgYellow, 'Environment were not loaded, loading manually from .env file...', Colors.Reset);
    // variables have not been loaded from .env file
    const file = path.resolve(__root, './.env');
    const data = Deno.readTextFileSync(file);
    const lines = data.split('\n');
    for (const line of lines) {
        const [key, value] = line.split('=');
        env[key.trim()] = value.replace(/"/g, '').replace(/'/g, '').trim();
    }
}

console.log(Colors.FgGreen, 'Environment variables loaded!', Colors.Reset);

export default env;