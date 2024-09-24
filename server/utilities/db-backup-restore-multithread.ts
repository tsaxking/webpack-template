import { attemptAsync, resolveAll, Result } from '../../shared/check';
import cliProgress from 'cli-progress';
import { workerData, isMainThread } from 'worker_threads';

interface Database {
    unsafe: {
        run: (sql: string, params?: unknown) => Promise<Result<unknown, Error>>;
    }
}

export const insertData = async (table: string, rows: Record<string, unknown>[], DB: Database, multibar: cliProgress.MultiBar) => {
    const bar = multibar.create(rows.length, 0, { table });
    return resolveAll(await Promise.all(rows.map(async (d) => attemptAsync(async () => {
        const q = `INSERT INTO ${table} (${Object.keys(d).join(', ')}) VALUES (${Object.keys(d).map((k) => `:${k}`).join(', ')})`;
        (await DB.unsafe.run(q, d)).unwrap();
        bar.increment();
    }))));
};

if (!isMainThread) {
    const { table, rows, DB, multibar } = workerData;

    insertData(table, rows, DB, multibar).then(res => {
        if (res.isErr()) {
            console.error(res.error);
            process.exit(1);
        } else {
            process.exit(0);
        }
    });
}