import { backToMain, selectFile } from '../manager';
import { repeatPrompt, select, confirm, prompt } from '../prompt';
import { addEntry } from '../add-entry';
import { __root } from '../../server/utilities/env';
import { DB } from '../../server/utilities/databases';
import Account from '../../server/structure/accounts';
import { uuid } from '../../server/utilities/uuid';
import { dateTime } from '../../shared/clock';
import { pullDeps } from '../pull-deps';
// import { run } from '../../new-server/utilities/run-task';
import fs from 'fs';
import path from 'path';

const { resolve } = path;

// const format = async () => {
//     return run('fmt', '.');
// };
// const check = async () => {
//     return run('lint', '.');
// };
// const build = async () => {
//     return run('task', 'build');
// };
const createEntry = async () => {
    const entryName = await repeatPrompt(
        'Enter the file name (relative to client/entries)',
        undefined,
        data => !!data.length,
        false
    );

    try {
        // check if file exists
        const file = resolve(__root, 'client', 'entries', entryName + '.ts');
        if (fs.existsSync(file)) {
            const isGood = await confirm(
                `File ${entryName}.ts already exists, do you want to overwrite it?`
            );
            if (!isGood) {
                return backToMain('Entry not created');
            }
        }
    } catch (error) {
        // file does not exist, continue
    }

    const importFile = await selectFile(
        resolve(__root, '/client/views'),
        'Select a file to import',
        file => file.endsWith('.svelte')
    );

    console.log(importFile);

    if (importFile.isOk()) {
        addEntry(entryName, importFile.value);
        backToMain(`Entry ${entryName} created`);
    } else {
        addEntry(entryName);
        backToMain(
            'No svelte file selected, created entry and going back to main menu'
        );
    }
};

const blacklist = async () => {
    const accountOrIp = await select<'Account' | 'IP'>(
        'Do you want to blacklist an account or an IP?',
        ['Account', 'IP', 'Remove']
    );

    if (accountOrIp === 'Account') {
        const accounts = await Account.getAll();
        const a = await select(
            'Select an account to blacklist',
            accounts.map(a => ({
                name:
                    a.username +
                    ' - ' +
                    a.email +
                    ' - ' +
                    a.firstName +
                    ' ' +
                    a.lastName,
                value: a
            }))
        );

        if (a) {
            const doBlacklist = await confirm(
                `Are you sure you want to blacklist ${a.username}?`
            );

            if (doBlacklist) {
                DB.run('blacklist/new', {
                    id: uuid(),
                    reason: 'Manually blacklisted',
                    accountId: a.id,
                    ip: '',
                    created: Date.now()
                });
                return backToMain('Account blacklisted');
            } else {
                return backToMain('Blacklist cancelled');
            }
        } else {
            return backToMain('No account selected');
        }
    } else if (accountOrIp === 'IP') {
        const fromNew = await select<'new' | 'session'>(
            'Is this a new IP or is currently attached to a session?',
            ['new', 'session']
        );

        if (fromNew === 'new') {
            const ip = await prompt('Enter the IP to blacklist');
            if (!ip) return backToMain('No IP entered');
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                const doBlacklist = await confirm(
                    `Are you sure you want to blacklist ${ip}?`
                );

                if (doBlacklist) {
                    DB.run('blacklist/new', {
                        id: uuid(),
                        reason: 'Manually blacklisted',
                        accountId: '',
                        ip,
                        created: Date.now()
                    });
                    return backToMain('IP blacklisted');
                } else {
                    return backToMain('Blacklist cancelled');
                }
            } else {
                return backToMain('Invalid IP');
            }
        } else {
            const sessions = await DB.all('sessions/all');
            if (sessions.isErr()) return backToMain('Error fetching sessions');

            const s = await select(
                'Select a session to blacklist',
                sessions.value
                    .filter((s, i, a) => {
                        const index = a.findIndex(x => x.ip === s.ip);
                        return index === i;
                    })
                    .map(s => ({
                        name: s.ip + ' - ' + dateTime(new Date(s.created)),
                        value: s
                    }))
            );

            if (s) {
                const doBlacklist = await confirm(
                    `Are you sure you want to blacklist ${s.ip}?`
                );

                if (doBlacklist) {
                    DB.run('blacklist/new', {
                        id: uuid(),
                        reason: 'Manually blacklisted',
                        accountId: '',
                        ip: s.ip || '',
                        created: Date.now()
                    });
                    return backToMain('IP blacklisted');
                } else {
                    return backToMain('Blacklist cancelled');
                }
            }
        }
    } else if (accountOrIp === 'Remove') {
        const blacklists = await DB.all('blacklist/all');
        if (blacklists.isErr()) return backToMain('Error fetching blacklists');

        const b = await select(
            'Select a blacklist to remove',
            blacklists.value.map(b => ({
                name: b.ip + ' - ' + b.accountId,
                value: b
            }))
        );

        if (b) {
            const doRemove = await confirm(
                `Are you sure you want to remove ${
                    b.ip ? b.ip : b.accountId
                } from the blacklist?`
            );

            if (doRemove) {
                DB.run('blacklist/delete', {
                    id: b.id
                });
                const { ip, accountId } = b;
                if (accountId) {
                    DB.run('blacklist/delete-by-account', { accountId });
                }
                if (ip) DB.run('blacklist/delete-by-ip', { ip });
                return backToMain('Blacklist removed');
            } else {
                return backToMain('Remove cancelled');
            }
        } else {
            return backToMain('No blacklist selected');
        }
    } else {
        return backToMain('No option selected');
    }
};

const getDependencies = async () => {
    const res = await pullDeps();
    if (res.isOk()) return backToMain('Dependencies pulled');
    return backToMain('Failed to pull dependencies: ' + res.error.message);
};

const clearLogs = async () => {
    const logToClear = await selectFile(
        resolve(__root, './storage/logs'),
        'Select a log to clear',
        file => file.endsWith('.csv')
    );

    if (logToClear.isOk()) {
        const confirmed = await confirm(
            `Are you sure you want to clear ${logToClear.value}?`
        );
        if (!confirmed) return backToMain('Clear cancelled');
        fs.writeFileSync(logToClear.value, '');
        return backToMain('Log cleared');
    } else {
        return backToMain('No log selected');
    }
};

export const general = [
    {
        icon: '📄',
        value: createEntry,
        description: 'Create a new front end entry file'
    },
    {
        icon: '🚫',
        value: blacklist,
        description: 'Blacklist an account or IP'
    },
    {
        icon: '📦',
        value: getDependencies,
        description: 'Pull dependencies'
    },
    {
        icon: '🧹',
        value: clearLogs,
        description: 'Clear logs'
    }
];
