import { DB } from '../../server/utilities/databases.ts';
import { log } from '../../server/utilities/terminal-logging.ts';
import { Random } from '../../shared/math.ts';

const create = () => {
    try {
        DB.unsafe.run(`
            CREATE TABLE IF NOT EXISTS test (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT
            )
        `);
    } catch (error) {
        log(error);
    }
};

const insert = (i: number) => {
    try {
        return new Promise<void>((res) => {
            DB.unsafe.run(
                `
                INSERT INTO test (name) VALUES(?)
            `,
                Random.uuid(),
            );

            res();
        });
    } catch (error) {
        log(i, error);
    }
};

const select = () => {
    try {
        return DB.unsafe.all(`
            SELECT * FROM test
        `);
    } catch (error) {
        log(error);
        return [];
    }
};

const remove = () => {
    try {
        DB.unsafe.run(`
            DELETE FROM test
        `);
    } catch (error) {
        log(error);
    }
};

const drop = () => {
    try {
        DB.unsafe.run(`
            DROP TABLE test
        `);
    } catch (error) {
        log(error);
    }
};

export const test = (num: number): number => {
    create();
    remove();
    const start = Date.now();
    for (let i = 0; i < num; i++) {
        insert(i);
    }
    let result: unknown[] = [];
    try {
        result = select();

        console.log(result.length === num, result.length, num);

        remove();

        const end = Date.now();
        console.log(end - start, (end - start) / num);
    } catch (error) {
        log(error);
    }

    drop();

    return result.length;
};
