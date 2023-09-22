import { DB } from "../../../server/utilities/databases.ts";
import { __root } from "../../../server/utilities/env.ts";
import path from 'npm:path';
import { daysTimeout } from "../../../shared/sleep.ts";
import { log } from "../../../server/utilities/terminal-logging.ts";



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


export const makeBackup = async () => {
    const v = DB.get('db/get-version');
    
    return Deno.copyFile(
        DB.path,
        path.resolve(__root, './storage/db/backups/' + v?.version + '-' + Date.now() + '.db')
    );
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



if (Deno.args.includes('--backup')) makeBackup();