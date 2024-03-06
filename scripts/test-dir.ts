import fs from 'fs';
import path from 'path';
import { __root } from '../server/utilities/env';

console.log(__root);

const readDir = async (dirPath: string): Promise<string[]> => {
    console.log('Reading:', dirPath);
    const entries = await fs.promises.readdir(dirPath);
    console.log('Entries:', entries);

    return (await Promise.all(entries.map(async e => {
        const fullpath = path.resolve(dirPath, e);

        if ((await fs.promises.stat(fullpath)).isFile()) {
            return fullpath;
        } else {
            return readDir(fullpath);
        }
    }))).flat(Infinity) as string[];
}

(async () => {
    const dirs = await readDir(
        path.resolve(__root, 'client', 'entries')
    );

    console.log(dirs);
})();