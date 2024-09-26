import { Version, DB } from '../server/utilities/databases';

DB.em.on('connect', async () => {
    const v = (await Version.current()).unwrap();
    console.log('Database version:', v.serialize('.'));
});
