import { __root, relative, resolve } from '../server/utilities/env.ts';
import { saveFile } from '../server/utilities/files.ts';
import { readDir, readFile } from '../server/utilities/files.ts';

const convert = (str: string) => {
    // find everything that's camelCase and convert it to snake_case
    // find everything that's PascalCase and convert it to snake_case

    str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
    str = str.toLowerCase();
    return str;
};

const convertFile = async (file: string) => {
    const contents = await readFile(file);
    if (contents.isOk()) {
        const str = contents.value;
        const newStr = convert(str);

        saveFile(file, newStr);
    } else {
        console.error(contents.error);
    }
};

const convertDir = async (dir: string) => {
    console.log(dir);
    const contents = await readDir(dir);

    if (contents.isOk()) {
        for (const entry of contents.value) {
            if (entry.isDirectory) {
                convertDir(resolve(dir, entry.name));
                continue;
            } else {
                if (!entry.name.endsWith('.sql')) continue;
                const file = relative(__root, resolve(dir, entry.name));

                try {
                    await convertFile(file);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
};

convertDir(resolve(__root, './storage/db/queries'));

convertFile(relative(__root, resolve(__root, './server/utilities/queries.ts')));

convertFile(relative(__root, resolve(__root, './server/utilities/tables.ts')));
