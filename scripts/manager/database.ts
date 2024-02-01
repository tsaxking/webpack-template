import { selectFile } from '../manager.ts';
import { makeBackup } from '../../storage/db/scripts/backups.ts';
import { Database } from 'https://deno.land/x/sqlite3@0.9.1/mod.ts';
import env, { __root, resolve } from '../../server/utilities/env.ts';
import { backToMain } from '../manager.ts';
import { confirm, repeatPrompt } from '../prompt.ts';
import { DB } from '../../server/utilities/databases.ts';

const restore = async () => {
    const db = await selectFile(
        'storage/db/backups',
        'Select a backup to restore',
        (file) => file.endsWith('.db'),
    );

    if (db.isOk()) {
        const file = db.value;
        makeBackup(
            new Database(
                resolve(__root, './storage/db', env.DATABASE_LINK + '.db'),
            ),
        );

        Deno.removeSync(
            resolve(__root, './storage/db', env.DATABASE_LINK + '.db'),
        );

        Deno.copyFileSync(
            file,
            resolve(__root, './storage/db', env.DATABASE_LINK + '.db'),
        );
        backToMain(`Database restored from ${file}`);
    } else {
        console.log(db.error);
        backToMain('No file selected');
    }
};

const newVersion = async () => {
    const latest = DB.latestVersion;
    if (!DB.hasVersion(latest)) {
        backToMain(
            'Database must be at the latest version, please restore the latest backup or update the database',
        );
        return;
    }

    const m = +repeatPrompt(
        'Enter the minor version number',
        undefined,
        (data) => !isNaN(parseInt(data)),
        false,
    );
    const p = +repeatPrompt(
        'Enter the patch version number',
        undefined,
        (data) => !isNaN(parseInt(data)),
        false,
    );

    const version: [number, number, number] = [1, m, p];

    if (DB.hasVersion(version)) {
        backToMain(
            `Version ${
                version.join('.')
            } already implemented (Current Version: ${DB.version.join('.')})`,
        );
        return;
    }
    const script = await confirm('Do you want a script?');

    Deno.writeTextFileSync(
        'storage/db/queries/db/versions/' + version.join('-') + '.sql',
        '-- Add your query here',
    );

    if (script) {
        Deno.writeTextFileSync(
            'storage/db/scripts/versions/' + version.join('-') + '.ts',
            `// add your script here`,
        );
    }
};

const versionInfo = () => {
    console.log('Latest version:', DB.latestVersion.join('.'));
    console.log('Current version:', DB.version.join('.'));
    backToMain('');
};

export const databases = [
    {
        icon: '🔄',
        value: restore,
    },
    {
        icon: '🆕',
        value: newVersion,
    },
    {
        icon: '🔍',
        value: versionInfo,
    },
];
