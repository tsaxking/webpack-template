import { backToMain, main, selectFile } from '../manager';
import { __root } from '../../server/utilities/env';
import { DB } from '../../server/utilities/database';
import { confirm, selectTable, select } from '../prompt';

export const selectDBTable = async () => {
    const tables = (await DB.getTables()).unwrap();
    return select(
        'Select a table...',
        tables.map(t => ({
            name: t.name,
            value: t
        }))
    );
};

export const viewTables = async () => {
    const table = await selectDBTable();
    if (!table) return backToMain('No table selected');

    const data = (await table.all().await()).unwrap();

    await selectTable(`${table.name} data`, data);

    return backToMain('Data view closed');
};

export const reset = async () => {
    const doReset = await confirm(
        'Are you sure you want to reset the database?'
    );

    if (doReset) {
        const selected = await select<'Reset' | 'Clear'>(
            'Do you wish to completely reset the database or remove all the data?',
            ['Reset', 'Clear']
        );

        (await DB.reset(selected === 'Reset')).unwrap();
        return backToMain('Database reset.');
    }
    return backToMain('Reset cancelled');
};

export const runUpdates = async () => {};

export const clearTable = async () => {
    const table = await selectDBTable();
    if (!table) return backToMain('No table selected');

    const doClear = await confirm(
        `Are you sure you want to clear all data from the table ${table.name}? (This is not reversible)`
    );

    if (doClear) {
        (await table.clear()).unwrap();
        return backToMain(`Table ${table.name} cleared`);
    }

    return backToMain('Clear cancelled');
};

export const dropTable = async () => {
    const table = await selectDBTable();
    if (!table) return backToMain('No table selected');

    const doDrop = await confirm(
        `Are you sure you want to drop the table ${table.name}? (This is not reversible, but it will cancel if there are contents. Clear first if you want to proceed)`
    );

    if (doDrop) {
        (await table.drop()).unwrap();
        return backToMain(`Table ${table.name} dropped`);
    }

    return backToMain('Drop cancelled');
};

export const restoreBackup = async () => {
    // full backup restoration
    const backups = (await DB.getBackups()).unwrap();
    const backup = await select(
        'Select a backup to restore...',
        backups.map(b => ({
            name: b,
            value: b
        }))
    );

    if (!backup) return backToMain('No backup selected');

    const doRestore = await confirm(
        `Are you sure you want to restore the backup ${backup}?`
    );

    if (doRestore) {
        (await DB.restore(backup)).unwrap();
        // process.exit(0);
        return backToMain(`Backup ${backup} restored`);
    }

    return backToMain('Restoration cancelled');
};

export const restoreTable = async () => {
    const table = await selectDBTable();
    if (!table) return backToMain('No table selected');
    const backups = (await table.getBackups()).unwrap();
    const backup = await select(
        'Select a backup to restore...',
        backups.map(b => ({
            name: b.filename,
            value: b
        }))
    );

    if (!backup) return backToMain('No backup selected');

    const doRestore = await confirm(
        `Are you sure you want to restore the backup ${backup.filename} to the table ${table.name}? (This is not reversible)`
    );

    if (doRestore) {
        (await backup.restore()).unwrap();
        return backToMain(
            `Backup ${backup.filename} restored to table ${table.name}`
        );
    }

    return backToMain('Restoration cancelled');
};

export const backupTable = async () => {
    const table = await selectDBTable();
    if (!table) return backToMain('No table selected');
    const backup = (await table.backup()).unwrap();
    backToMain(`Backup created: ${backup.filename}`);
};

export const backup = async () => {
    const backup = (await DB.backup()).unwrap();
    backToMain(`Backup created: ${backup}`);
};

export const databases = [
    {
        value: viewTables,
        icon: '📇',
        description: 'View the data in a table'
    },
    {
        value: reset,
        icon: '🔄',
        description: 'Resets the database to the latest version'
    },
    {
        value: runUpdates,
        icon: '🔃',
        description: 'Runs any available updates'
    },
    {
        value: clearTable,
        icon: '🗑️',
        description: 'Clears all data from a table'
    },
    {
        value: restoreBackup,
        icon: '🔙',
        description: 'Restores a backup'
    },
    {
        value: backup,
        icon: '💾',
        description: 'Creates a backup'
    }
];
