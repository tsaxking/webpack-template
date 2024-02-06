import { DB } from '../server/utilities/databases.ts';

const tables = await DB.getTables();
if (tables.isErr()) throw tables.error;

console.log(tables.value);

if (!tables.value.includes(Deno.args[0].toLowerCase())) {
    throw new Error('Table not found. Please check the name and try again.');
}

const res = await DB.unsafe.all(`
    SELECT * FROM ${Deno.args[0]}
`);

if (res.isOk()) console.log(res.value);
else throw new Error(res.error.message);
