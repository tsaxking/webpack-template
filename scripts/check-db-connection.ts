import { DB } from '../server/utilities/databases';

(async () => {
    const v = await DB.getVersion();
    console.log('Database version:', v.join('.'));
})();
