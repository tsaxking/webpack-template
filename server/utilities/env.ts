import path from 'npm:path';
import callsite from 'npm:callsite';
import { Colors } from "./colors.ts";

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
const env: {
    [key: string]: string | undefined;
} = Deno.env.toObject();

if (Object.keys(env).length === 55) {
    console.error(Colors.BgRed, 'Environment variables not loaded', Colors.Reset, 'You may need to restart by saving an application file or create a ".env" file');
} else {
    console.log('Environment variables loaded!');
}

export default env;

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __root = new URL('../../', import.meta.url).pathname;

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __uploads = path.resolve(__root, './storage/uploads/');

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __logs = path.resolve(__root, './storage/logs/');

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __templates = path.resolve(__root, './storage/templates/');

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:39 PM
 */
export const dirname = () => {
    const site = callsite()[2];
    return './' + path.relative(__root, site.getFileName().replace('file:', ''));
}