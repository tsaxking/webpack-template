import { DB } from "../server/utilities/databases.ts";
import { random } from "../shared/uuid.ts";

const create = () => {
    DB.unsafe.run(`
        CREATE TABLE IF NOT EXISTS test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )
    `);
}

const insert = () => {
    return new Promise<void>((res, rej) => {
        DB.unsafe.run(`
            INSERT INTO test (name) VALUES(?)
        `, random());

        res();
    });
}

const select = () => {
    return DB.unsafe.all(`
        SELECT * FROM test
    `);
}

const remove = () => {
    DB.unsafe.run(`
        DELETE FROM test
    `);
}


create();
remove();
const num = 10000;
const start = Date.now();
for (let i = 0; i < num; i++) {
    try {
        insert();
    } catch (error) {
        console.log(i, error);
    }
}
const result = select();

console.log(result.length === num, result.length, num);

remove();

const end = Date.now();
console.log(end - start, (end-start)/num);