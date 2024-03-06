// import { DB } from '../server/utilities/databases';
import { readFile } from '../server/utilities/files';
import { fromCamelCase, toSnakeCase } from '../shared/text';

// const tables = await DB.getTables();
// if (tables.isErr()) throw tables.error;

// console.log(tables.value);

// if (!tables.value.includes(Deno.args[0].toLowerCase())) {
//     throw new Error('Table not found. Please check the name and try again.');
// }

// const res = await DB.unsafe.all(`
//     SELECT * FROM ${Deno.args[0]}
// `);

// if (res.isOk()) console.log(res.value);
// else throw new Error(res.error.message);
(async () => {
    const deCamelCase = (str: string) => {
        // return str;
        return str.replace(
            /[A-Z]*[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/g,
            word => {
                // console.log(toSnakeCase(fromCamelCase(word)));
                let w = toSnakeCase(fromCamelCase(word));
                if (w.startsWith('_')) {
                    w = w.slice(1);
                    // capitalize first letter
                    // w = w.charAt(0).toUpperCase() + w.slice(1);
                }
                return w;
            }
        );
    };

    const initSql = await readFile('storage/db/queries/db/init.sql');

    if (initSql.isOk()) {
        const data = ` SELECT column_name
        FROM information_schema.columns
        WHERE table_name = :table
        ORDER BY column_name;`;
        // deCamelCase(data);
        console.log(deCamelCase(data));
    } else {
        throw initSql.error;
    }
})();
