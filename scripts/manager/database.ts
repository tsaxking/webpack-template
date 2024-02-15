import { backToMain, main, selectFile } from '../manager.ts';
import { __root } from '../../server/utilities/env.ts';
import { addQuery, merge, parseSql } from '../parse-sql.ts';
import { DB } from '../../server/utilities/databases.ts';
import { confirm, repeatPrompt, search, select } from '../prompt.ts';
import {
    readDir,
    readFile,
    saveFileSync,
} from '../../server/utilities/files.ts';
import { relative, resolve } from '../../server/utilities/env.ts';
import * as cliffy from 'https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts';

export const buildQueries = async () => {
    await parseSql('server/utilities', 'server/utilities');
    backToMain('Queries built');
};

export const versionInfo = async () => {
    const [current, latest] = await Promise.all([
        DB.getVersion(),
        DB.latestVersion(),
    ]);

    console.log(`Current: ${current.join('.')}\nLatest: ${latest.join('.')}`);
    await select('', ['[Back]']);
    return main();
};

export const newVersion = async () => {
    const minor = repeatPrompt(
        'Minor version (1.x.0)',
        undefined,
        (d) => !isNaN(+d),
        false,
    );
    const patch = repeatPrompt(
        `Patch version (1.${minor}.x)`,
        undefined,
        (d) => !isNaN(+d),
        false,
    );

    if (await DB.hasVersion([1, +minor, +patch])) {
        return backToMain('Version already exists');
    }

    saveFileSync(
        `storage/db/queries/db/versions/1-${minor}-${patch}.sql`,
        `-- New version 1.${minor}.${patch}\n\n`,
    );

    const doScript = await confirm('Do you want a script for this version?');
    if (doScript) {
        saveFileSync(
            `storage/db/scripts/versions/1-${minor}-${patch}.ts`,
            `// New version 1.${minor}.${patch}\n\nDeno.exit(0) // Please do not remove this`,
        );
    }

    backToMain('Version created');
};

export const viewTables = async () => {
    const tables = await DB.getTables();
    if (tables.isOk()) {
        const values = tables.value.map((t) => ({ name: t, value: t }));
        values.push({ name: '[Back]', value: 'back' });
        const table = await select('Select table to view', values);
        if (table === 'back') return main();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await DB.unsafe.all<any>(`SELECT * FROM ${table}`);
        if (data.isOk()) {
            // using cliffy to display the data
            const tableData = data.value;
            const keys = Object.keys(tableData[0] || {});
            const values = tableData.map((d) =>
                Object.values(d).map((a) => {
                    switch (typeof a) {
                        case 'bigint':
                            return a.toString() + 'n';
                        case 'object':
                            return JSON.stringify(a);
                        default:
                            return a;
                    }
                })
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const table = new cliffy.Table().header(keys).body(values as any);
            console.log(table.toString());

            await select('', ['[Back]']);
            return main();
        } else {
            return backToMain('Error getting data: ' + data.error.message);
        }
    } else {
        backToMain('Error getting tables: ' + tables.error.message);
    }
};

export const mergeQueries = async () => {
    const allFiles = await readDir(resolve(__root, './server/utilities'));
    if (allFiles.isOk()) {
        const files = allFiles.value.filter(
            (f) => f.isFile && f.name.match(/\w+-[0-9]+.ts/)?.length,
        );
        if (!files.length) return backToMain('No files to merge');
        const mergables = files.reduce((acc, f) => {
            const num = Number(f.name.match(/[0-9]+/)?.[0] || 'NaN');
            if (!isNaN(num) && !acc.includes(num)) acc.push(num);
            return acc;
        }, [] as number[]);
        const selected = await select(
            'Select file to merge',
            mergables.map((m) => ({
                name: `Merge ${m}`,
                value: m,
            })),
        );

        if (isNaN(selected)) return backToMain('Invalid file selected');

        const res = await merge(selected);
        if (res.isOk()) {
            backToMain('Queries merged');
        } else {
            backToMain('Error merging queries: ' + res.error.message);
        }
    } else {
        backToMain('Error reading files: ' + allFiles.error.message);
    }
};

export const addQueryType = async () => {
    const file = await selectFile(resolve(__root, './storage/db/queries'));

    if (file.isOk()) {
        const contents = await readFile(file.value);
        if (contents.isOk()) {
            const rel = relative(
                resolve(__root, './storage/db/queries'),
                file.value,
            );
            const res = await addQuery(
                'server/utilities/queries.ts',
                'server/utilities/tables.ts',
                contents.value,
                rel,
            );

            if (res.isOk()) backToMain('Query added');
            else backToMain('Error adding query: ' + res.error.message);
        } else {
            backToMain('Error reading file: ' + contents.error);
        }
    } else {
        backToMain('Error selecting file: ' + file.error.message);
    }
};

export const reset = async () => {
    const doReset = await confirm(
        'Are you sure you want to reset the database?',
    );

    if (doReset) {
        const backup = await DB.makeBackup();
        if (backup.isErr()) {
            return backToMain('Error making backup: ' + backup.error.message);
        }

        const reset = await DB.reset();
        if (reset.isErr()) {
            return backToMain(
                'Error resetting database: ' + reset.error.message,
            );
        }
        return backToMain('Database reset and updated to latest version.');
    } else {
        return backToMain('Reset cancelled');
    }
};

export const runUpdates = async () => {
    await DB.runAllUpdates();
    return backToMain('Ran all available updates');
};

export const clearTable = async () => {
    const tables = await DB.getTables();
    if (tables.isOk()) {
        const table = await select(
            'Select table to clear',
            tables.value.map((t) => ({ name: t, value: t })),
        );

        const doClear = await confirm(
            `Are you sure you want to clear ${table}?`,
        );
        if (doClear) {
            const res = await DB.unsafe.run(`DELETE FROM ${table}`);
            if (res.isOk()) {
                backToMain('Table cleared');
            } else {
                backToMain('Error clearing table: ' + res.error.message);
            }
        } else {
            backToMain('Clear cancelled');
        }
    } else {
        backToMain('Error getting tables: ' + tables.error.message);
    }
};

export const restoreBackup = async () => {
    const backups = await readDir(resolve(__root, './storage/db/backups'));
    if (backups.isErr()) {
        return backToMain('Error reading backups: ' + backups.error.message);
    }

    const backup = await search(
        'Search for a backup to restore',
        backups.value.map((b) => ({
            name: b.name,
            value: b.name,
        })),
    );

    if (backup.isErr()) {
        return backToMain('Error selecting backup: ' + backup.error);
    }

    const res = await DB.restoreBackup(backup.value);
    if (res.isOk()) {
        backToMain('Backup restored');
    } else {
        backToMain('Error restoring backup: ' + res.error.message);
    }
};

export const backup = async () => {
    const res = await DB.makeBackup();
    if (res.isOk()) {
        backToMain('Backup created');
    } else {
        backToMain('Error creating backup: ' + res.error.message);
    }
};

export const databases = [
    {
        value: buildQueries,
        icon: '🔨',
        description: 'Builds the query types from the sql files',
    },
    {
        value: mergeQueries,
        icon: '🔀',
        description: 'Merges the query files into a single file',
    },
    {
        value: versionInfo,
        icon: '📊',
        description: 'Shows the current and latest version of the database',
    },
    {
        value: newVersion,
        icon: '🆕',
        description:
            'Creates a new version of the database, can create a .ts file if you need to also run a script',
    },
    {
        value: viewTables,
        icon: '📇',
        description: 'View the data in a table',
    },
    {
        value: reset,
        icon: '🔄',
        description: 'Resets the database to the latest version',
    },
    {
        value: runUpdates,
        icon: '🔃',
        description: 'Runs any available updates',
    },
    {
        value: clearTable,
        icon: '🗑️',
        description: 'Clears all data from a table',
    },
    {
        value: restoreBackup,
        icon: '🔙',
        description: 'Restores a backup',
    },
    {
        value: backup,
        icon: '💾',
        description: 'Creates a backup',
    },
];
