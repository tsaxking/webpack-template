import { DB } from '../server/utilities/databases.ts';

const res = await DB.unsafe.all(`
    SELECT * FROM ${Deno.args[0]}
`);

if (res.isOk()) console.log(res.value);
else throw new Error(res.error.message);
