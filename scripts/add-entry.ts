import { Colors } from '../server/utilities/colors';
import { __root, unify } from '../server/utilities/env';
import { attempt } from '../shared/check';
import fs from 'fs';
import path from 'path';
import { prompt } from './prompt';

const { dirname, relative, resolve } = path;

const [, , ...args] = process.argv;

export const runEntryPrompt = async () => {
    if (args.length) {
        return addEntry(args[0]);
    }
    const input = await prompt('File name (relative to client/entries):');

    if (!input) {
        console.error('No file name provided');
        process.exit(1);
    }

    addEntry(input);
};

export const addEntry = (name: string, importFile?: string) => {
    const filepath = resolve(__root, 'client', 'entries', name + '.ts');
    const dir = dirname(filepath);

    // attempt(() => Deno.mkdirSync(dir, { recursive: true }));
    attempt(() => fs.mkdirSync(dir, { recursive: true }));

    const importsRelative = relative(
        dir,
        resolve(__root, 'client', 'utilities', 'imports')
    );

    const imports = `import '${unify(importsRelative)}';
${
    importFile
        ? `import App from '${unify(
              relative(dir, resolve(__root, importFile))
          )}';

const myApp = new App({ target: document.body });
`
        : ''
}
`;

    // Deno.writeFileSync(filepath, new TextEncoder().encode(imports));
    fs.writeFileSync(filepath, imports);
};

// if (import.meta.main) {
//     console.warn(
//         `⚠️ ${Colors.FgYellow}Running this script will be deprecated soon, please use "deno task manager" and select [General] -> Create Entry instead.${Colors.Reset} ⚠️`,
//     );
//     runEntryPrompt();
// }

// if (require.main) {
//     console.warn(
//         `⚠️ ${Colors.FgYellow}Running this script will be deprecated soon, please use "deno task manager" and select [General] -> Create Entry instead.${Colors.Reset} ⚠️`
//     );
//     runEntryPrompt();
// }
