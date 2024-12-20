import { Colors } from '../server/utilities/colors';
import env from '../server/utilities/env';
import { sleep } from '../shared/sleep';
// import { DB } from '../server/utilities/database';
import { Client } from 'pg';

const main = async () => {
    if (env.ENVIRONMENT !== 'test' && !process.argv.includes('--force'))
        throw new Error('This script can only be run in test environment');
    for (let count = 5; count > 0; count--) {
        console.clear();
        console.warn(
            Colors.FgYellow,
            `This script will reset the database, You have ${count} second${count > 0 ? 's' : ''} to cancel...`,
            Colors.Reset
        );
        await sleep(1000);
    }

    const db = new Client({
        user: env.DATABASE_USER,
        database: env.DATABASE_NAME,
        host: env.DATABASE_HOST,
        password: env.DATABASE_PASSWORD,
        port: Number(env.DATABASE_PORT),
        keepAlive: true
    });

    await db.connect();

    const tables = await db.query<{
        table_name: string;
    }>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
        `);

    for (const table of tables.rows) {
        await db.query(`DROP TABLE ${table.table_name};`);
    }

    process.exit(0);
};

if (require.main === module) main();
