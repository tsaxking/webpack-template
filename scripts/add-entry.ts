import { Colors } from '../server/utilities/colors.ts';
import {
    __root,
    dirname,
    relative,
    resolve,
    unify,
} from '../server/utilities/env.ts';
import { attempt } from '../shared/check.ts';

const [, ...args] = Deno.args;

export const runEntryPrompt = () => {
    if (args.length) {
        return addEntry(args[0]);
    }
    const input = prompt('File name (relative to client/entries):');

    if (!input) {
        console.error('No file name provided');
        Deno.exit(1);
    }

    addEntry(input);
};

export const addEntry = (name: string, importFile?: string) => {
    const filepath = resolve(__root, 'client', 'entries', name + '.ts');
    const dir = dirname(filepath);

    attempt(() => Deno.mkdirSync(dir, { recursive: true }));

    const importsRelative = relative(
        dir,
        resolve(__root, 'client', 'utilities', 'imports'),
    );

    const imports = `import '${unify(importsRelative)}';
${
        importFile
            ? `import App from '${
                unify(
                    relative(dir, resolve(__root, importFile)),
                )
            }';

const myApp = new App({ target: document.body });
`
            : ''
    }
`;

    Deno.writeFileSync(filepath, new TextEncoder().encode(imports));
};

if (import.meta.main) {
    console.warn(
        `⚠️ ${Colors.FgYellow}Running this script will be deprecated soon, please use "deno task manager" and select [General] -> Create Entry instead.${Colors.Reset} ⚠️`,
    );
    runEntryPrompt();
}
