import { DB } from '../server/utilities/databases.ts';

console.log(DB.unsafe.all(`SELECT * FROM ${Deno.args[0]}`));
