// Purpose: convert all SQL files to snake_case

import { __root } from '../server/utilities/env';
import { saveFile } from '../server/utilities/files';
import { readFile } from '../server/utilities/files';
import fs from 'fs';
import path from 'path';

const { resolve, relative } = path;

/**
 * Converts a string to snake_case
 * @date 3/8/2024 - 6:55:22 AM
 *
 * @param {string} str
 * @returns {string}
 */
const convert = (str: string) => {
    // find everything that's camelCase and convert it to snake_case
    // find everything that's PascalCase and convert it to snake_case

    str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
    str = str.toLowerCase();
    return str;
};

/**
 * Converts a file to snake_case
 * @date 3/8/2024 - 6:55:22 AM
 *
 * @async
 * @param {string} file
 * @returns {*}
 */
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

/**
 * Converts a directory to snake_case
 * @date 3/8/2024 - 6:55:22 AM
 *
 * @async
 * @param {string} dir
 * @returns {*}
 */
const convertDir = async (dir: string) => {
    console.log(dir);
    const contents = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of contents) {
        if (entry.isDirectory()) {
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
};

convertDir(resolve(__root, './storage/db/queries'));

convertFile(relative(__root, resolve(__root, './server/utilities/queries')));

convertFile(relative(__root, resolve(__root, './server/utilities/tables')));
