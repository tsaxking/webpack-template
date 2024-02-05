import { backToMain, selectFile } from '../manager.ts';
import { __root } from '../../server/utilities/env.ts';
import { addQuery, parseSql } from '../parse-sql.ts';
import { DB } from '../../server/utilities/databases.ts';
import { confirm, repeatPrompt } from '../prompt.ts';
import { readFile, saveFileSync } from '../../server/utilities/files.ts';
import { relative, resolve } from '../../server/utilities/env.ts';

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
        backToMain(tables.value.join('\n'));
    } else {
        backToMain('Error getting tables: ' + tables.error.message);
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

export const databases = [
    {
        value: buildQueries,
        icon: '🔨',
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
];
