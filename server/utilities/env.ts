const env = Deno.env.toObject();

export default env;

export const __root = new URL('../../', import.meta.url).pathname;