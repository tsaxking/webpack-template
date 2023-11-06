import { __root } from "../../../server/utilities/env.ts";
import path from 'npm:path';
import { DB } from "../../../server/utilities/databases.ts";
import { log } from "../../../server/utilities/terminal-logging.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";



export const init = (name: string) => {
    log('Initializing database...');
    const filePath = path.resolve(__root, './storage/db/queries/db/init.sql');
    const query = Deno.readTextFileSync(filePath);
    const db = new Database(
        path.resolve(__root, './storage/db/', name + '.db')
    );

    db.exec(query);
}