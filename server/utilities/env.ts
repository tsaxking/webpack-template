import path from 'npm:path';

const env = Deno.env.toObject();

export default env;

export const __root = new URL('../../', import.meta.url).pathname;

export const __uploads = path.resolve(__root, './storage/uploads/');

export const __logs = path.resolve(__root, './storage/logs/');