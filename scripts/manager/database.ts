import { selectDir, backToMain } from '../manager.ts';
import { __root } from '../../server/utilities/env.ts';
import { parseSql } from '../parse-sql.ts';

export const buildQueries = async () => {
    const queriesDir = await selectDir(
        __root,
        'Select the directory for the queries');
    const tablesDir = await selectDir(
        __root,
        'Select the directory for the tables');

    if (queriesDir.isOk() && tablesDir.isOk()) {
        await parseSql(queriesDir.value, tablesDir.value);
        return backToMain('Queries built successfully');
    }

    return backToMain('No directories selected');
};


export const databases = [
    {
        value: buildQueries,
        icon: '🔨',
    }
];