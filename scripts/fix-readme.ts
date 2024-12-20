import { __root } from '../server/utilities/env';
import { readFile, saveFile } from '../server/utilities/files';

const [, , arg] = process.argv;
if (!arg) throw new Error('No argument provided');

const main = async () => {
    let readme = (await readFile('./README.md')).unwrap();
    readme = readme.replaceAll('tsaxking/webpack-template', arg);
    (await saveFile('./README.md', readme)).unwrap();
    process.exit(0);
};
main();
