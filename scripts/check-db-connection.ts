import { DB } from '../server/utilities/databases.ts';

const v = await DB.getVersion();
console.log('Database version:', v.join('.'));
