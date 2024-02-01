import Role from '../server/structure/roles.ts';
import Account from '../server/structure/accounts.ts';
import { confirm, repeatPrompt, select } from './prompt.ts';
import { Colors } from '../server/utilities/colors.ts';
import { sleep } from '../shared/sleep.ts';
import { attemptAsync, Result } from '../shared/check.ts';
import { Permission } from '../shared/permissions.ts';
import { DB } from '../server/utilities/databases.ts';
import { RolePermission } from '../shared/db-types.ts';
import { __root, relative, resolve } from '../server/utilities/env.ts';
import { addEntry } from './add-entry.ts';
import { addStatus, addSocket } from './add-status.ts';
import Filter from 'npm:bad-words';
import { StatusCode } from '../shared/status-messages.ts';

const filter = (str: string): boolean => {
    if (str.length < 3) return false;
    const filter = new Filter();
    const filtered = filter.clean(str);
    if (filtered !== str) {
        console.log('Invalid input: contains bad words');
        return false;
    }
    return true;
};

const backToMain = async (message: string) => {
    console.log(message);
    await sleep(2000);
    main();
};

const title = (t: string) => {
    console.clear();
    console.log(Colors.FgGreen, t, Colors.Reset);
};

const selectRole = async (message = 'Select a role'): Promise<Result<Role>> => {
    return attemptAsync(async () => {
        const roles = Role.all();
        if (!roles.length) {
            throw new Error('no-role');
        }

        return await select<Role>(
            message,
            roles.map((role) => ({
                name: role.name,
                value: role,
            })),
        );
    });
};

const selectAccount = async (
    message = 'select an account',
): Promise<Result<Account>> => {
    return attemptAsync(async () => {
        const accounts = Account.all;
        if (!accounts.length) {
            throw new Error('no-account');
        }

        return await select<Account>(
            message,
            accounts.map((account) => ({
                name: account.username,
                value: account,
            })),
        );
    });
};

const selectBootstrapColor = async (
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

const selectStatusCode = async (): Promise<number> => {
    const level = await select(
        'Select a status code level',
        [{
            name: '1xx (Informational)',
            value: 1,
        }, {
            name: '2xx (Success)',
            value: 2,
        }, {
            name: '3xx (Redirection)',
            value: 3,
        }, {
            name: '4xx (Client Error)',
            value: 4,
        }, {
            name: '5xx (Server Error)',
            value: 5,
        }],
    );

    switch (level) {
        case 1:
            return await select(
                'Select a 1xx status code',
                [{
                    name: '100 Continue',
                    value: 100,
                }, {
                    name: '101 Switching Protocols',
                    value: 101,
                }, {
                    name: '102 Processing',
                    value: 102,
                }, {
                    name: '103 Early Hints',
                    value: 103,
                }],
            );

        case 2:
            return await select(
                'Select a 2xx status code',
                [{
                    name: '200 OK',
                    value: 200,
                }, {
                    name: '201 Created',
                    value: 201,
                }, {
                    name: '202 Accepted',
                    value: 202,
                }, {
                    name: '203 Non-Authoritative Information',
                    value: 203,
                }, {
                    name: '204 No Content',
                    value: 204,
                }, {
                    name: '205 Reset Content',
                    value: 205,
                }, {
                    name: '206 Partial Content',
                    value: 206,
                }, {
                    name: '207 Multi-Status',
                    value: 207,
                }, {
                    name: '208 Already Reported',
                    value: 208,
                }, {
                    name: '226 IM Used',
                    value: 226,
                }],
            );
        case 3:
            return await select(
                'Select a 3xx status code',
                [{
                    name: '300 Multiple Choices',
                    value: 300,
                }, {
                    name: '301 Moved Permanently',
                    value: 301,
                }, {
                    name: '302 Found',
                    value: 302,
                }, {
                    name: '303 See Other',
                    value: 303,
                }, {
                    name: '304 Not Modified',
                    value: 304,
                }, {
                    name: '305 Use Proxy',
                    value: 305,
                }, {
                    name: '306 Switch Proxy',
                    value: 306,
                }, {
                    name: '307 Temporary Redirect',
                    value: 307,
                }, {
                    name: '308 Permanent Redirect',
                    value: 308,
                }],
            );
        case 4:
            return await select(
                'Select a 4xx status code',
                [{
                    name: '400 Bad Request',
                    value: 400,
                }, {
                    name: '401 Unauthorized',
                    value: 401,
                }, {
                    name: '402 Payment Required',
                    value: 402,
                }, {
                    name: '403 Forbidden',
                    value: 403,
                }, {
                    name: '404 Not Found',
                    value: 404,
                }, {
                    name: '405 Method Not Allowed',
                    value: 405,
                }, {
                    name: '406 Not Acceptable',
                    value: 406,
                }, {
                    name: '407 Proxy Authentication Required',
                    value: 407,
                }, {
                    name: '408 Request Timeout',
                    value: 408,
                }, {
                    name: '409 Conflict',
                    value: 409,
                }, {
                    name: '410 Gone',
                    value: 410,
                }, {
                    name: '411 Length Required',
                    value: 411,
                }, {
                    name: '412 Precondition Failed',
                    value: 412,
                }, {
                    name: '413 Payload Too Large',
                    value: 413,
                }, {
                    name: '414 URI Too Long',
                    value: 414,
                }, {
                    name: '415 Unsupported Media Type',
                    value: 415,
                }, {
                    name: '416 Range Not Satisfiable',
                    value: 416,
                }, {
                    name: '417 Expectation Failed',
                    value: 417,
                }, {
                    name: "418 I'm a teapot",
                    value: 418,
                }, {
                    name: '421 Misdirected Request',
                    value: 421,
                }, {
                    name: '422 Unprocessable Entity',
                    value: 422,
                }, {
                    name: '423 Locked',
                    value: 423,
                }, {
                    name: '424 Failed Dependency',
                    value: 424,
                }, {
                    name: '425 Too Early',
                    value: 425,
                }, {
                    name: '426 Upgrade Required',
                    value: 426,
                }, {
                    name: '428 Precondition Required',
                    value: 428,
                }, {
                    name: '429 Too Many Requests',
                    value: 429,
                }, {
                    name: '431 Request Header Fields Too Large',
                    value: 431,
                }, {
                    name: '451 Unavailable For Legal Reasons',
                    value: 451,
                }],
            );
        case 5:
            return await select(
                'Select a 5xx status code',
                [{
                    name: '500 Internal Server Error',
                    value: 500,
                }, {
                    name: '501 Not Implemented',
                    value: 501,
                }, {
                    name: '502 Bad Gateway',
                    value: 502,
                }, {
                    name: '503 Service Unavailable',
                    value: 503,
                }, {
                    name: '504 Gateway Timeout',
                    value: 504,
                }, {
                    name: '505 HTTP Version Not Supported',
                    value: 505,
                }, {
                    name: '506 Variant Also Negotiates',
                    value: 506,
                }, {
                    name: '507 Insufficient Storage',
                    value: 507,
                }, {
                    name: '508 Loop Detected',
                    value: 508,
                }, {
                    name: '510 Not Extended',
                    value: 510,
                }, {
                    name: '511 Network Authentication Required',
                    value: 511,
                }],
            );
        default:
            throw new Error('Invalid status code level');
    }
};

const selectFile = async (
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

const createRole = async () => {
    title('Create a new role');
    const roleName = repeatPrompt(
        'Enter the new role name',
        undefined,
        (data) => !Role.fromName(data),
        false,
    );
    const roleDescription = repeatPrompt('Enter the role description');
    const roleRank = +repeatPrompt(
        'Enter the role rank',
        undefined,
        (data) => !isNaN(parseInt(data)),
        false,
    );

    Role.new(roleName, roleDescription, roleRank);

    backToMain(`Role ${roleName} created`);
};

const deleteRole = async () => {
    title('Delete a role');

    const res = await selectRole();
    if (res.isOk()) {
        const isGood = await confirm(
            `Are you sure you want to delete the role ${res.value.name}?`,
        );

        if (isGood) {
            res.value.delete();
            backToMain(`Role ${res.value.name} deleted`);
        } else {
            backToMain('Role not deleted');
        }
    } else {
        backToMain('No roles to delete');
    }
};

const addRole = async () => {
    title('Add a role to an account');
    const roleRes = await selectRole();

    if (roleRes.isOk()) {
        const accountRes = await selectAccount();
        if (accountRes.isOk()) {
            const account = accountRes.value;
            const role = roleRes.value;

            if (account.roles.some((r) => r.name === role.name)) {
                backToMain(
                    `Account ${account.username} already has role ${role.name}`,
                );
            } else {
                account.addRole(role);
                backToMain(
                    `Role ${role.name} added to account ${account.username}`,
                );
            }
        }
    } else {
        backToMain('No roles to add');
    }
};

const removeRole = async () => {
    title('Remove a role from an account');
    const accountRes = await selectAccount();

    if (accountRes.isOk()) {
        const account = accountRes.value;
        const roles = account.roles;
        if (!roles.length) {
            backToMain(`Account ${account.username} has no roles`);
        } else {
            const role = await select<Role>(
                'Select a role to remove',
                roles.map((r) => ({
                    name: r.name,
                    value: r,
                })),
            );

            if (role) {
                account.removeRole(role);
                backToMain(
                    `Role ${role.name} removed from account ${account.username}`,
                );
            } else {
                backToMain('No roles to remove');
            }
        }
    } else {
        backToMain('No accounts to remove roles from');
    }
};

const addPermissions = async () => {
    title('Add permissions to a role');
    const roleRes = await selectRole('Select a role to add permissions to');

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = role.getPermissions();

        const permName = repeatPrompt(
            'Enter the permission name',
            undefined,
            (data) => !perms.some((p) => p === data),
            false,
        );
        const description = repeatPrompt('Enter the permission description');
        role.addPermission(permName as unknown as Permission, description);

        const allPermissions = DB.all('permissions/all');
        const uniqueNames = allPermissions
            .map((p: RolePermission) => p.permission)
            .filter(
                (p: string, i: number, arr: string[]) => arr.indexOf(p) === i,
            );
        const ts = `export type Permission = ${
            uniqueNames
                .map((n) => `'${n}'`)
                .join(' | ')
        };`;
        Deno.writeTextFileSync('./shared/permissions.ts', ts);

        backToMain(`Permission ${permName} added to role ${role.name}`);
    } else {
        backToMain('No roles to add permissions to');
    }
};

const removePermissions = async () => {
    title('Remove permissions from a role');
    const roleRes = await selectRole(
        'Select a role to remove permissions from',
    );

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = role.getPermissions();
        if (!perms.length) {
            backToMain(`Role ${role.name} has no permissions`);
        } else {
            const perm = await select<Permission>(
                'Select a permission to remove',
                perms.map((p) => ({
                    name: p,
                    value: p,
                })),
            );

            if (perm) {
                role.removePermission(perm);
                backToMain(`Permission ${perm} removed from role ${role.name}`);
            } else {
                backToMain('No permissions to remove');
            }
        }
    } else {
        backToMain('No roles to remove permissions from');
    }
};

const verifyAccount = async () => {
    title('Verify an account');
    const accounts = Account.unverifiedAccounts;
    if (!accounts.length) return backToMain('No accounts to verify');

    const account = await select<Account>(
        'Select an account to verify',
        accounts.map((a) => ({
            name: a.username,
            value: a,
        })),
        {
            return: true,
        },
    );

    if (account) {
        account.verify();
        backToMain(`Account ${account.username} verified`);
    } else {
        backToMain('Could not find account :(');
    }
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

const createStatus = async () => {
    title('Create a new status message');
    const text = Deno.readTextFileSync('shared/status-messages.ts');

    const allStatuses = Array.from(text
        .matchAll(/('[\w:-]+'):/g)); // match all status message names

    const groups = allStatuses.map((i) => i[0].match(/[\w]+/));

    // console.log(groups);

    let group = await select<string>(
        'Select a status group:',
        [
            '[new]',
            ...groups.map((i) => i ? i[0] : null).filter(Boolean).filter((
                g,
                i,
                a,
            ) => a.indexOf(g) === i),
        ] as string[],
    );

    if (group === '[new]') {
        group = repeatPrompt(
            'Enter the new status group name',
            undefined,
            (data) => {
                const has = allStatuses.some((i) => i[0] === `'${data}:'`);
                if (has) {
                    console.log('Group already exists');
                    return false;
                }

                return filter(data);
            },
            false,
        );
    }

    const name = repeatPrompt('Enter the status name', undefined, (data) => {
        const has = allStatuses.some((i) => i[0] === `'${group}':${data}`);
        if (has) {
            console.log('Status already exists');
            return false;
        }
        return filter(data);
    }, false);

    const message = repeatPrompt('Enter the status message', undefined, filter);
    const color = await selectBootstrapColor('Select a color');
    const code = await selectStatusCode() as StatusCode;
    const instructions = prompt('Enter the status instructions (if any)') || '';
    const redirect = prompt('Enter the status redirect (if any)') || undefined;

    addStatus({
        group,
        name,
        message,
        color,
        code,
        instructions,
        redirect,
    });
};

const addSocketEvent = async () => {
    title('Create a socket event');

    const text = Deno.readTextFileSync('shared/socket.ts');
    const currentSockets = Array.from(text.matchAll(/'([\w:-]+)'/g));

    const socketEvent = repeatPrompt(
        'Please enter a socket name',
        undefined,
        (data) => !currentSockets.find((m) => m[0] === `'${data}'`),
        false,
    );

    addSocket(socketEvent);
};

const main = async () => {
    title('Welcome to the Deno Task Manager!');
    type MainCommands =
        | 'create-role'
        | 'delete-role'
        | 'add-role'
        | 'remove-role'
        | 'add-permissions'
        | 'remove-permissions'
        | 'exit'
        | 'verify-account'
        | 'create-entrypoint'
        | 'create-status'
        | 'add-socket-event';

    const data = await select<MainCommands>('Please select a task', [
        {
            name:
                'Create a new front end entrypoint (replaces deno task entry)',
            value: 'create-entrypoint',
        },
        {
            name: 'Create a new status message (replaces deno task status)',
            value: 'create-status',
        },
        {
            name: 'Create a new role',
            value: 'create-role',
        },
        {
            name: 'Delete a role',
            value: 'delete-role',
        },
        {
            name: 'Add a role to an account',
            value: 'add-role',
        },
        {
            name: 'Remove a role from an account',
            value: 'remove-role',
        },
        {
            name: 'Add permissions to a role',
            value: 'add-permissions',
        },
        {
            name: 'Remove permissions from a role',
            value: 'remove-permissions',
        },
        {
            name: 'Verify an account',
            value: 'verify-account',
        },
        {
            name: 'Add a socket event',
            value: 'add-socket-event',
        },
        {
            name: 'Exit',
            value: 'exit',
        },
    ]);

    switch (data) {
        case 'create-role':
            await attemptAsync(createRole);
            break;
        case 'delete-role':
            await attemptAsync(deleteRole);
            break;
        case 'add-role':
            await attemptAsync(addRole);
            break;
        case 'remove-role':
            await attemptAsync(removeRole);
            break;
        case 'add-permissions':
            await attemptAsync(addPermissions);
            break;
        case 'remove-permissions':
            await attemptAsync(removePermissions);
            break;
        case 'verify-account':
            await attemptAsync(verifyAccount);
            break;
        case 'create-entrypoint':
            await attemptAsync(createEntry);
            break;
        case 'create-status':
            await attemptAsync(createStatus);
            break;
        case 'add-socket-event':
            await attemptAsync(addSocketEvent);
            break;
        case 'exit':
            Deno.exit(0);
    }

    // backToMain('Task completed, going back to main menu');
};

main();
