import {
    __root,
    dirname,
    relative,
    resolve,
    unify,
} from '../server/utilities/env.ts';
import { attempt } from '../shared/attempt.ts';

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

export const addEntry = (name: string) => {
    const filepath = resolve(__root, 'client', 'entries', name + '.ts');
    const dir = dirname(filepath);

    attempt(() => Deno.mkdirSync(dir, { recursive: true }));

    const importsRelative = relative(
        dir,
        resolve(__root, 'client', 'utilities', 'imports'),
    );

    const imports = `import '${unify(importsRelative)}';`;

    Deno.writeFileSync(filepath, new TextEncoder().encode(imports));
};

runEntryPrompt();
