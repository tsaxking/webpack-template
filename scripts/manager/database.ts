import { backToMain, selectDir } from '../manager.ts';
import { __root } from '../../server/utilities/env.ts';
import { parseSql } from '../parse-sql.ts';
import { DB } from '../../server/utilities/databases.ts';
import { confirm, repeatPrompt } from '../prompt.ts';
import { saveFileSync } from '../../server/utilities/files.ts';

export const buildQueries = async () => {
    const queriesDir = await selectDir(
        __root,
        'Select the directory for the queries',
    );
    const tablesDir = await selectDir(
        __root,
        'Select the directory for the tables',
    );

    if (queriesDir.isOk() && tablesDir.isOk()) {
        await parseSql(queriesDir.value, tablesDir.value);
        return backToMain('Queries built successfully');
    }

    return backToMain('No directories selected');
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
