import { __root } from "../../../server/utilities/env.ts";
import path from 'npm:path';
import { daysTimeout } from "../../../shared/sleep.ts";
import { log, error } from "../../../server/utilities/terminal-logging.ts";
import { getDBVersion } from "./init.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";



function makeDir() {
    try {
        Deno.readDirSync(
            path.resolve(__root, './storage/db/backups')
        );
    } catch {
        log('Creating backups directory');
        Deno.mkdirSync(
            path.resolve(__root, './storage/db/backups')
        );
    }
};

makeDir();


export const makeBackup = (db: Database) => {
    try {
        let [M, m, p] = getDBVersion(db);
    
        if (!m) m = 0;
        if (!p) p = 0;
    
        const v = M + '-' + m + '-' + p;
    
        return Deno.copyFileSync(
            db.path,
            path.resolve(__root, './storage/db/backups/' + v + ':' + Date.now() + '.db')
        );
    } catch (e) {
        error('Unable to make backup:', e);
    }
};



export const setIntervals = () => {
    // delete backups after 30 days

    const files = Deno.readDirSync(
        path.resolve(__root, './storage/db/backups')
    );

    for (const file of files) {
        if (file.isFile) {
            const [,date] = file.name.replace('.db', '').split('-');

            const diff = Date.now() - parseInt(date);
            const days = 30- Math.floor(diff / 1000 / 60 / 60 / 24);

            log('Removing file', file.name, 'in', days, 'days');


            daysTimeout(() => {
                Deno.removeSync(
                    path.resolve(__root, './storage/db/backups/' + file.name)
                );
            }, days);
        }
    }
};

export const restore = (db: Database, version: [number, number | undefined, number | undefined]) => {
    let [M, m, p] = version;
    if (!m) m = 0;
    if (!p) p = 0;
    const files = Deno.readDirSync(
        path.resolve(__root, './storage/db/backups')
    );

    for (const file of files) {
        if (file.isFile) {
            const [versionData] = file.name.split(':');
            const [M_, m_, p_] = versionData.split('-').map(v => parseInt(v));

            if (M_ === M && m_ === m && p_ === p) {
                Deno.copyFile(
                    path.resolve(__root, './storage/db/backups/' + file.name),
                    db.path
                );
                return;
            }
        }
    }
};
