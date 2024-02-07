import { resolve } from '../server/utilities/env.ts';
import { readDir, readFile } from '../server/utilities/files.ts'

const convert = (str: string) => {
    // find everything that's camelCase and convert it to snake_case
    // find everything that's PascalCase and convert it to snake_case

    str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
    str = str.toLowerCase();
    return str;
}

const convertDir = async (dir: string) => {
    const contents = await readDir(dir);

    if (contents.isOk()) {
        for (const entry of contents.value) {
            if (entry.isDirectory) return convertDir(
                resolve(
                    dir,
                    entry.name
                )
            );
            else {
                const contents = await readFile(
                    resolve(
                        dir,
                        entry.name
                    )
                );
                if (contents.isOk()) {
                    const str = contents.value;
                    const newStr = convert(str);
                    console.log(newStr);
                }
            }
        }
    }
}