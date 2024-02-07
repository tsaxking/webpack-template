import { backToMain, main, selectFile } from '../manager.ts';
import { __root } from '../../server/utilities/env.ts';
import { addQuery, getTables, merge, parseSql } from '../parse-sql.ts';
import { DB } from '../../server/utilities/databases.ts';
import { confirm, repeatPrompt, select } from '../prompt.ts';
import {
    readDir,
    readFile,
    saveFileSync,
} from '../../server/utilities/files.ts';
import { relative, resolve } from '../../server/utilities/env.ts';
import { fromCamelCase, toSnakeCase } from '../../shared/text.ts';
import { attemptAsync, Err, Result } from '../../shared/check.ts';
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

    backToMain(`Current: ${current.join('.')}\nLatest: ${latest.join('.')}`);
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
            `// New version 1.${minor}.${patch}\n\n`,
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
            const values = tableData.map((d) => Object.values(d));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const table = new cliffy.Table().header(keys).body(values as any);
            console.log(table.toString());

            await select('Exit', ['[Back]']);
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

export const makeDefaultQueries = async () => {
    return backToMain('Not implemented');
    const tables = await getTables();

    const name = await select<string>(
        'Select table to make default queries for',
        Object.keys(tables),
    );

    const t = tables[name];
    if (!t) return backToMain('Table not found');

    const parsedName = toSnakeCase(fromCamelCase(name), '-');

    const hasNew = await readFile(`/storage/db/queries/${parsedName}/new.sql`);
    const hasGet = await readFile(`/storage/db/queries/${parsedName}/get.sql`);
    const hasDelete = await readFile(
        `/storage/db/queries/${parsedName}/delete.sql`,
    );
};

export const reset = async () => {
    const doReset = await confirm(
        'Are you sure you want to reset the database?',
    );
    const version = await DB.getVersion();

    if (doReset) {
        await DB.makeBackup();
        const tables = await DB.getTables();
        if (tables.isOk()) {
            const reset = async (): Promise<Result<void>> => {
                return attemptAsync(async () => {
                    const res = await Promise.all(
                        tables.value.map((t) =>
                            DB.unsafe.run(`DROP TABLE ${t}`)
                        ),
                    );
                    if (res.every((r) => r.isOk())) {
                        return DB.runAllUpdates();
                    } else {
                        const errors = res.filter((r) => r.isErr()) as Err[];
                        throw new Error(
                            'Error resetting database: ' +
                                errors.map((e) => e.error).join('\n'),
                        );
                    }
                });
            };

            const saveData = await select(
                'Do you want to save all data currently stored?',
                [
                    {
                        name: 'Yes, Save, Reset, and reapply data.',
                        value: true,
                    },
                    {
                        name: 'No, Reset and delete all data',
                        value: false,
                    },
                ],
            );

            if (saveData) {
                const data = await Promise.all(
                    tables.value.map((t) => {
                        return DB.unsafe.all<{
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            [key: string]: any;
                        }>(`SELECT * FROM ${t}`);
                    }),
                );

                if (data.every((d) => d.isOk())) {
                    const res = await reset();
                    if (res.isOk()) {
                        await Promise.all(
                            data.map((d, i) => {
                                // this shouldn't ever happen, but typescript, for some reason, doesn't know that
                                if (d.isErr()) throw new Error(d.error.message);
                                const table = tables.value[i];
                                for (const col of d.value) {
                                    const cols = Object.keys(col);
                                    DB.unsafe
                                        .run(
                                            `
                                        INSERT INTO ${table} (${
                                                cols.join(
                                                    ', ',
                                                )
                                            })
                                        VALUES (${
                                                cols
                                                    .map((c) => ':' + c)
                                                    .join(', ')
                                            }
                                    `,
                                            col,
                                        )
                                        .then((r) => {
                                            if (r.isErr()) {
                                                throw new Error(
                                                    r.error.message,
                                                );
                                            }
                                        });
                                }
                            }),
                        );
                        return backToMain(
                            'Database reset and updated to latest version. All data was saved.',
                        );
                    } else {
                        DB.restoreBackup(version);
                    }
                } else {
                    const errors = data.filter((d) => d.isErr()) as Err[];
                    return backToMain(
                        'Error saving data: ' +
                            errors.map((e) => e.error.message).join('\n'),
                    );
                }
            } else {
                const res = await reset();

                if (res.isOk()) {
                    return backToMain(
                        'Database reset and updated to latest version. All data was deleted.',
                    );
                } else {
                    DB.restoreBackup(version);
                    return backToMain(
                        'Error resetting database: ' + res.error.message,
                    );
                }
            }
        } else {
            return backToMain('Error getting tables: ' + tables.error.message);
        }
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

export const databases = [
    {
        value: buildQueries,
        icon: '🔨',
    },
    {
        value: mergeQueries,
        icon: '🔀',
    },
    {
        value: versionInfo,
        icon: '📊',
    },
    {
        value: newVersion,
        icon: '🆕',
    },
    {
        value: viewTables,
        icon: '📇',
    },
    // {
    //     value: addQueryType,
    //     icon: '📝',
    // },
    // {
    //     value: makeDefaultQueries,
    //     icon: '📄',
    // },
    {
        value: reset,
        icon: '🔄',
    },
    {
        value: runUpdates,
        icon: '🔃',
    },
    {
        value: clearTable,
        icon: '🗑️',
    },
];
