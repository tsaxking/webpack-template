import path from 'npm:path';
import callsite from 'npm:callsite';

const env = Deno.env.toObject();

export default env;

export const __root = new URL('../../', import.meta.url).pathname;

export const __uploads = path.resolve(__root, './storage/uploads/');

export const __logs = path.resolve(__root, './storage/logs/');

export const dirname = () => {
    const site = callsite()[2];
    return './' + path.relative(__root, site.getFileName().replace('file:', ''));
}