import path from 'npm:path';
import callsite from 'npm:callsite';
import { Colors } from "./colors.ts";

const env = Deno.env.toObject();

if (Object.keys(env).length === 55) {
    console.error(Colors.BgRed, 'Environment variables not loaded', Colors.Reset, 'You may need to restart by saving an application file or create a ".env" file');
} else {
    console.log('Environment variables loaded!');
}

export default env;

export const __root = new URL('../../', import.meta.url).pathname;

export const __uploads = path.resolve(__root, './storage/uploads/');

export const __logs = path.resolve(__root, './storage/logs/');

export const __templates = path.resolve(__root, './storage/templates/');

export const dirname = () => {
    const site = callsite()[2];
    return './' + path.relative(__root, site.getFileName().replace('file:', ''));
}