import { confirm, repeatPrompt, select } from './prompt.ts';
import { Colors } from '../server/utilities/colors.ts';
import { sleep } from '../shared/sleep.ts';
import { attemptAsync, Result } from '../shared/check.ts';
import { __root, relative, resolve } from '../server/utilities/env.ts';
import { addEntry } from './add-entry.ts';
import Filter from 'npm:bad-words';


import { accounts } from './manager/accounts.ts';
import { roles } from './manager/roles.ts';
import { statuses } from './manager/status.ts';
import { permissions } from './manager/permissions.ts';
import { databases } from './manager/database.ts';



export const filter = (str: string): boolean => {
    if (str.length < 3) return false;
    const filter = new Filter();
    const filtered = filter.clean(str);
    if (filtered !== str) {
        console.log('Invalid input: contains bad words');
        return false;
    }
    return true;
};

export const backToMain = async (message: string) => {
    console.log(message);
    await sleep(2000);
    main();
};

export const title = (t: string) => {
    console.clear();
    console.log(Colors.FgGreen, t, Colors.Reset);
};




export const selectBootstrapColor = async (
    message = 'Select a color',
): Promise<string> => {
    const runSelect = async () => {
        const data = await attemptAsync(async () => {
            return await select(
                message,
                [
                    'primary',
                    'secondary',
                    'success',
                    'danger',
                    'warning',
                    'info',
                    'light',
                    'dark',
                ].map((i) => ({
                    name: i,
                    value: i,
                })),
            );
        });

        if (data.isOk()) return data.value;
        else return runSelect();
    };

    return runSelect();
};



export const selectFile = async (
    dir: string,
    message = 'Select a file or directory',
    test?: (file: string) => boolean,
): Promise<Result<string>> => {
    const root = relative(__root, dir);
    dir = root;
    const fileIcon = '📄';
    const dirIcon = '📁';

    const rootTest = (file: string) => {
        const rel = relative(dir, file);
        return !rel.startsWith('..');
    };

    const run = async (dir: string): Promise<string | null> => {
        const entries = Array.from(Deno.readDirSync(dir));
        entries.push({
            name: '..',
            isDirectory: true,
            isFile: false,
            isSymlink: false,
        });

        const data = await select(
            message,
            entries.map((e) => ({
                name: e.isDirectory
                    ? `${dirIcon} ${e.name}`
                    : `${fileIcon} ${e.name}`,
                value: e,
            })),
        );

        if (data) {
            if (data.isDirectory) {
                return run(`${dir}/${data.name}`);
            } else {
                if (test && !test(`${dir}/${data.name}`)) {
                    console.log('Invalid file, please select another');
                    return run(dir);
                }

                if (!rootTest(`${dir}/${data.name}`)) {
                    console.log(`Invalid file, the file must be in ${root}`);
                    return run(dir);
                }

                return resolve(`${dir}/${data.name}`);
            }
        }

        return null;
    };

    const data = await attemptAsync(async () => {
        const res = await run(resolve(dir));
        if (res) {
            return relative(__root, res);
        } else {
            throw new Error('no-dir');
        }
    });

    if (data.isOk()) console.log(data.value);

    return data;
};





const createEntry = async () => {
    title('Create a new front end entrypoint');
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
        addEntry(
            entryName,
            importFile.value,
        );
        backToMain(`Entry ${entryName} created`);
    } else {
        addEntry(entryName);
        backToMain(
            'No svelte file selected, created entry and going back to main menu',
        );
    }
};











const main = async () => {
    title('Welcome to the Deno Task Manager!');

    type MainCommands = 
        'roles' |
        'entry' |
        'status' |
        'database' |
        'permissions' |
        'accounts' |
        'exit';

    const data = await select<MainCommands>('Please select a task or task group', [
        {
            name: 'New Entry (replaces deno task entry)',
            value: 'entry'
        },
        {
            name: '[Roles]',
            value: 'roles'
        },
        {
            name: '[Status]',
            value: 'status'
        },
        {
            name: '[Database]',
            value: 'database'
        },
        {
            name: '[Permissions]',
            value: 'permissions',
        },
        {
            name: '[Accounts]',
            value: 'accounts'
        },
        {
            name: 'Exit',
            value: 'exit'
        }
    ]);

    switch (data) {
        case 'entry':
            await attemptAsync(createEntry);
            break;
        case 'roles':
            await attemptAsync(roles);
            break;
        case 'status':
            await attemptAsync(statuses);
            break;
        case 'database':
            await attemptAsync(databases);
            break;
        case 'permissions':
            await attemptAsync(permissions);
            break;
        case 'accounts':
            await attemptAsync(accounts);
            break;
        case 'exit':
            Deno.exit(0);
    }

    backToMain('Task completed, going back to main menu');
};

main();
