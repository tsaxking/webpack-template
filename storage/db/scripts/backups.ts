import { __root, resolve } from '../../../server/utilities/env.ts';
import { daysTimeout } from '../../../shared/sleep.ts';
import { error, log } from '../../../server/utilities/terminal-logging.ts';
import { getDBVersion } from './init.ts';
import { Database } from 'https://deno.land/x/sqlite3@0.9.1/mod.ts';

function makeDir() {
    try {
        Deno.readDirSync(
            './storage/db/backups',
        );
    } catch {
        log('Creating backups directory');
        Deno.mkdirSync(
            './storage/db/backups',
        );
    }
}

makeDir();

export const makeBackup = (db: Database) => {
    try {
        let [M, m, p] = getDBVersion(db);

        if (!m) m = 0;
        if (!p) p = 0;

        const v = M + '-' + m + '-' + p;

        return Deno.copyFileSync(
            db.path,
            './storage/db/backups/v' + v + 'd' + Date.now() + '.db',
        );
    } catch (e) {
        error('Unable to make backup:', e);
    }
};

export const setIntervals = () => {
    // delete backups after 30 days

    const files = Deno.readDirSync(
        './storage/db/backups',
    );

    for (const file of files) {
        if (file.isFile) {
            const [, date] = file.name.replace('.db', '').split('d');

            const diff = Date.now() - parseInt(date);
            const days = 30 - Math.floor(diff / 1000 / 60 / 60 / 24);

            log('Removing file', file.name, 'in', days, 'days');

            daysTimeout(() => {
                Deno.removeSync(
                    resolve(__root, './storage/db/backups/' + file.name),
                );
            }, days);
        }
    }
};

export const restore = (
    db: Database,
    version?: [number, number | undefined, number | undefined],
) => {
    const files = Array.from(Deno.readDirSync(
        resolve(__root, './storage/db/backups'),
    ));

    // sort by date, most recent first
    files.sort((a, b) => {
        const [, aDate] = a.name.replace('.db', '').split(':');
        const [, bDate] = b.name.replace('.db', '').split(':');

        return parseInt(bDate) - parseInt(aDate);
    });

    if (!version) {
        // restore most recent backup
        const files = Array.from(Deno.readDirSync(
            resolve(__root, './storage/db/backups'),
        ));
        const [file] = files;

        if (!file) {
            error('No backups found');
            return;
        }

        Deno.copyFile(
            resolve(__root, './storage/db/backups/' + file.name),
            db.path,
        );

        return;
    }

    let [M, m, p] = version;
    if (!m) m = 0;
    if (!p) p = 0;

    for (const file of files) {
        if (file.isFile) {
            const [versionData] = file.name.split(':');
            const [M_, m_, p_] = versionData.split('-').map((v) => parseInt(v));

            if (M_ === M && m_ === m && p_ === p) {
                Deno.copyFile(
                    resolve(__root, './storage/db/backups/' + file.name),
                    db.path,
                );
                return;
            }
        }
    }
};
