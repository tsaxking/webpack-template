import { backToMain, selectFile } from '../manager.ts';
import { repeatPrompt } from '../prompt.ts';
import { addEntry } from '../add-entry.ts';
import { __root, resolve } from '../../server/utilities/env.ts';
// import { runCommand } from '../../server/utilities/run-task.ts';

// const format = async () => {
//     return runCommand('deno fmt .');
// };
// const check = async () => {
//     return runCommand('deno lint .');
// };
// const build = async () => {
//     return runCommand('deno task build');
// };
const createEntry = async () => {
    const entryName = repeatPrompt(
        'Enter the file name (relative to client/entries)',
        undefined,
        (data) => !!data.length,
        false,
    );

    // check if file exists
    const file = resolve(__root, 'client', 'entries', entryName + '.ts');
    if (Deno.statSync(file)) {
        const isGood = await confirm(
            `File ${entryName}.ts already exists, do you want to overwrite it?`,
        );
        if (!isGood) {
            return backToMain('Entry not created');
        }
    }

    const importFile = await selectFile(
        '/client/views',
        'Select a file to import',
        (file) => file.endsWith('.svelte'),
    );

    if (importFile.isOk()) {
        addEntry(entryName, importFile.value);
        backToMain(`Entry ${entryName} created`);
    } else {
        addEntry(entryName);
        backToMain(
            'No svelte file selected, created entry and going back to main menu',
        );
    }
};

export const general = [
    {
        icon: '📄',
        value: createEntry,
        // }, {
        //     icon: '📝',
        //     value: format,
        // }, {
        //     icon: '🔍',
        //     value: check,
        // }, {
        //     icon: '🔨',
        //     value: build,
    },
];
