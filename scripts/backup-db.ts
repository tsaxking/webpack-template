import { DB, Backup } from '../server/utilities/databases';

DB.em.on('connect', async () => {
    (await Backup.makeBackup()).unwrap();
    process.exit(0);
});
