import path from 'path';
import { DB } from '../server/utilities/database';
import { TableBackup } from '../server/utilities/database/databases';

const main = async () => {
    const [, , backup] = process.argv;

    if (!backup) {
        console.error('No backup file provided');
        process.exit(1);
    }

    const b = new TableBackup(
        path.resolve(__dirname, '../storage/db/backups', backup),
        DB
    );

    (await b.restore()).unwrap();

    console.log('Database restored');
    process.exit(0);
};

if (require.main === module) {
    main().catch(console.error);
}
