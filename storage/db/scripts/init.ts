import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { __root } from "../../../server/utilities/env.ts";
import path from 'npm:path';

const filePath = path.resolve(__root, './storage/db/queries/db/init.sql');
// console.log(filePath);


const db = new Database(
    path.resolve(__root, './storage/db/minecraft.db')
);

const query = Deno.readTextFileSync(filePath);

db.exec(query);
db.close();