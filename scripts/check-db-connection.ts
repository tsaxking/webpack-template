import { DB } from '../server/utilities/database';

const main = async () => {
    const connect = await DB.connect();
    if (connect.isErr()) {
        console.error('Failed to connect to database');
        process.exit(1);
    }

    console.log(`Connected to database: ${connect.value}`);
};

main();
