import { Backup } from '../server/utilities/databases';

const main = async () => {
    const [, , backup] = process.argv;

    if (!backup) {
        console.error('No backup file provided');
        process.exit(1);
    }

    (await Backup.restoreBackup(Backup.from(backup).unwrap())).unwrap();

    console.log('Database restored');
    process.exit(0);
};

if (require.main === module) {
    main().catch(console.error);
}
