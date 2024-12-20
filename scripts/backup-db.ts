import { DB } from '../server/utilities/database';

DB.connect().then(async () => {
    const backup = (await DB.backup()).unwrap();
    console.log(`Backup created: ${backup}`);
});
