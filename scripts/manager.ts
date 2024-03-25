// Purpose: This file is the main entry point for the manager script
// This is a cli tool for managing the server

import { select } from './prompt';
import { Colors } from '../server/utilities/colors';
import { attemptAsync, Result } from '../shared/check';
import { __root } from '../server/utilities/env';
import Filter from 'bad-words';
import { capitalize, fromCamelCase } from '../shared/text';
import { accounts } from './manager/accounts';
import { roles } from './manager/roles';
import { statuses } from './manager/status';
import { permissions } from './manager/permissions';
import { databases } from './manager/database';
import { general } from './manager/general';
import { serverController } from './manager/server-controller';
import fs from 'fs';
import path from 'path';
import { DB } from '../server/utilities/databases';
const { resolve, relative } = path;

/**
 * A list of some icons for the cli
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @type {{ success: string; error: string; warning: string; info: string; account: string; role: string; status: string; permission: string; database: string; entry: string; exit: string; verify: string; remove: string; create: string; restore: string; back: string; controller: string; }}
 */
export const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    account: '👤',
    role: '🔐',
    status: '🔵',
    permission: '🔒',
    database: '📂',
    entry: '📄',
    exit: '🚪',
    verify: '🔍',
    remove: '🗑️',
    create: '➕',
    restore: '🔄',
    back: '⬅️',
    controller: '🎮'
};

/**
 * Colorizes the title of a section
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @param {string} str
 * @returns {string}
 */
const colorTitle = (str: string) => name(str, Colors.FgBlue);

/**
 * Filters a string for bad words
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @param {string} str
 * @returns {boolean}
 */
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

/**
 * Returns back to main
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @async
 * @param {string} message
 * @returns {*}
 */
export const backToMain = async (message: string) => {
    await select(message, ['[Ok]']);
    main();
};

/**
 * Clears the console and logs a title
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @param {string} t
 */
export const title = (t: string) => {
    console.clear();
    console.log(Colors.FgGreen, t, Colors.Reset);
    console.log(' ' + '-'.repeat(t.length));
};

/**
 * Prompt for bootstrap colors
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @async
 * @param {string} [message='Select a color']
 * @returns {Promise<string>}
 */
export const selectBootstrapColor = async (
    message = 'Select a color'
): Promise<string> => {
    const runSelect = async (): Promise<string> => {
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
                    'dark'
                ].map(i => ({
                    name: i,
                    value: i
                }))
            );
        });

        if (data.isOk()) return data.value;
        else return runSelect();
    };

    return runSelect();
};

/**
 * Selects a file or directory
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @async
 * @param {string} dir
 * @param {string} [message='Select a file or directory']
 * @param {?(file: string) => boolean} [test]
 * @returns {Promise<Result<string>>}
 */
export const selectFile = async (
    dir: string,
    message = 'Select a file or directory',
    test?: (file: string) => boolean
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
        // const entries = Array.from(Deno.readDirSync(dir));
        const entries = Array.from(fs.readdirSync(dir)).map(e => {
            const stat = fs.statSync(path.resolve(dir, e));
            return {
                name: e,
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile(),
                isSymlink: stat.isSymbolicLink()
            };
        });
        entries.push({
            name: '..',
            isDirectory: true,
            isFile: false,
            isSymlink: false
        });

        const data = await select(
            message,
            entries.map(e => ({
                name: e.isDirectory
                    ? `${dirIcon} ${e.name}`
                    : `${fileIcon} ${e.name}`,
                value: e
            }))
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

/**
 * Selects a directory
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @async
 * @param {string} dir
 * @param {string} [message='Select a directory']
 * @returns {Promise<Result<string>>}
 */
export const selectDir = async (
    dir: string,
    message = 'Select a directory'
): Promise<Result<string>> => {
    const root = relative(__root, dir);
    // dir = root;
    // console.log({ dir });
    // return attemptAsync(async () =>  {
    //     return '';
    // });
    const dirIcon = '📁';
    const rootTest = (file: string) => {
        const rel = relative(dir, file);
        return !rel.startsWith('..');
    };

    const run = async (dir: string): Promise<string | null> => {
        const entries = Array.from(fs.readdirSync(dir))
            .filter(e => fs.statSync(e).isDirectory())
            .map(e => ({
                name: e,
                isDirectory: true,
                isFile: false,
                isSymlink: fs.lstatSync(e).isSymbolicLink()
            }));
        entries.push({
            name: '..',
            isDirectory: true,
            isFile: false,
            isSymlink: false
        });
        entries.unshift({
            name: '[Select this directory]',
            isDirectory: false,
            isFile: false,
            isSymlink: false
        });

        const data = await select(
            message,
            entries.map(e => ({
                name: e.isDirectory
                    ? `${dirIcon} ${e.name}`
                    : `${dirIcon} ${e.name}`,
                value: e
            }))
        );

        if (data) {
            if (data.isDirectory) {
                return run(`${dir}/${data.name}`);
            } else {
                // if they reached this point, they selected the current directory
                if (!rootTest(dir)) {
                    console.log(
                        `Invalid directory, the directory must be in ${root}`
                    );
                    return run(dir);
                }

                return resolve(dir);
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
    else console.error(data.error);

    return data;
};

/**
 * Returns a colorized string
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @param {string} str
 * @param {Colors} color
 * @returns {string}
 */
const name = (str: string, color: Colors) =>
    `${color}[${capitalize(fromCamelCase(str))}]${Colors.Reset}`;

/**
 * Main function
 * @date 3/8/2024 - 6:49:57 AM
 *
 * @async
 * @returns {*}
 */
export const main = async () => {
    title('Welcome to the Task Manager!');
    const exit = () => {
        console.log('Goodbye!');
        // process.exit(0);
        process.exit(0);
    };

    if (process.argv.includes('-h') || process.argv.includes('--help')) {
        console.log('This is a task manager for the server');
        console.log('It allows you to perform various tasks');

        const map = (s: {
            icon: string;
            value: () => Promise<void>;
            description?: string;
        }): string => {
            return `  ${s.icon} ${name(
                s.value.name,
                Colors.FgMagenta
            )} ${s.description}`;
        };

        const doMap = (
            data: {
                icon: string;
                value: () => Promise<void>;
                description?: string;
            }[]
        ) => data.map(map);

        console.log(
            [
                // blue('Server Controller')
                // ...serverController.map((s) => '\t' + s.description),
                colorTitle('General'),
                ...doMap(general),
                colorTitle('Accounts'),
                ...doMap(accounts),
                colorTitle('Roles'),
                ...doMap(roles),
                colorTitle('Statuses'),
                ...doMap(statuses),
                colorTitle('Permissions'),
                ...doMap(permissions),
                colorTitle('Databases'),
                ...doMap(databases)
            ].join('\n')
        );

        await select('', ['[Exit]']).then(exit);
    }

    const makeObj = (
        name: string,
        data: {
            icon: string;
            value: () => void;
            description?: string;
        }[],
        icon: string
    ) => {
        if (!data.length) return [];
        return [
            {
                name: `${icon} [${name}]`,
                value: async () => {
                    title(name);
                    const res = await select(
                        `Please select a task for ${name}`,
                        [
                            ...data.map(d => ({
                                name: `${d.icon} ${capitalize(
                                    fromCamelCase(d.value.name)
                                )}`,
                                value: async () => {
                                    title(
                                        `${name} > ${capitalize(
                                            fromCamelCase(d.value.name)
                                        )}`
                                    );

                                    try {
                                        return d.value();
                                    } catch (e) {
                                        console.error(e);
                                        return await select('', ['[Ok]']);
                                    }
                                }
                            })),
                            {
                                name: `${icons.back} [Back]`,
                                value: main
                            },
                            {
                                name: `${icons.exit} Exit`,
                                value: exit
                            }
                        ]
                    );

                    if (res) {
                        return res();
                    } else {
                        backToMain('No tasks selected');
                    }
                }
            }
        ];
    };

    const fn = await select<() => unknown>('Please select a task', [
        ...makeObj('Server Controller', serverController, icons.controller),
        ...makeObj('General', general, icons.entry),
        ...makeObj('Accounts', accounts, icons.account),
        ...makeObj('Roles', roles, icons.role),
        ...makeObj('Statuses', statuses, icons.status),
        ...makeObj('Permissions', permissions, icons.permission),
        ...makeObj('Databases', databases, icons.database),
        {
            name: `${icons.exit} Exit`,
            value: exit
        }
    ]);

    await fn();
};

DB.em.on('connect', main);
