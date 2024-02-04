import { __root, resolve } from '../../../server/utilities/env.ts';
import { error, log } from '../../../server/utilities/terminal-logging.ts';
import { makeBackup, restore } from './backups.ts';
import fs from 'node:fs';
import { runTask } from '../../../server/utilities/run-task.ts';
import { DB } from '../../../server/utilities/databases.ts';

/**
 * Returns the current database version
 * @date 12/7/2023 - 1:37:31 PM
 */
export const getDBVersion = async (
): Promise<[number, number, number]> => {
    try {
        return DB.getVersion();
    } catch {
        log('Error getting database version');
        return [0, 0, 0];
    }
};

/**
 * Initializes the database
 * @date 12/7/2023 - 1:37:31 PM
 */
export const init = async () => {
    log(`Initializing database...`);
    const filePath = './storage/db/queries/db/init.sql';
    const query = Deno.readTextFileSync(filePath);

    const [M, m, p] = await getDBVersion();
    log('Current database version:', M + '.' + m + '.' + p);
    if (!M) {
        log('Creating database...');
        DB.unsafe.run(query);
    } else {
        log('Database already exists');
    }

    return setVersions();
};

/**
 * Runs all version scripts and queries
 * @date 12/7/2023 - 1:37:31 PM
 *
 * @async
 */
export const setVersions = async () => {
    const versionDir = resolve(__root, './storage/db/queries/db/versions');

    const files = Array.from(Deno.readDirSync(versionDir));

    // sort by version, lowest first (M.m.p)
    files.sort((a, b) => {
        const [aM, am, ap] = a.name
            .replace('.sql', '')
            .split('-')
            .map((v: string) => parseInt(v));
        const [bM, bm, bp] = b.name
            .replace('.sql', '')
            .split('-')
            .map((v: string) => parseInt(v));

        if (aM !== bM) {
            return aM - bM;
        }
        if (am !== bm) {
            return am - bm;
        }
        if (ap !== bp) {
            return ap - bp;
        }

        return 0;
    });

    for (const sql of files) {
        if (sql.isFile) {
            // check if version is already installed
            const [M, m, p] = await getDBVersion();

            const [_M, _m, _p] = sql.name
                .replace('.sql', '')
                .split('-')
                .map((v) => parseInt(v));

            if (isNaN(_M) || isNaN(_m) || isNaN(_p)) {
                throw new Error(
                    'Invalid version file: ' +
                        sql.name +
                        'All version files must be named like this: 1-0-0.sql',
                );
            }

            // console.log('current', M, m, p);
            // console.log('test', _M, _m, _p);

            const installedStr = 'Skipping version ' +
                _M +
                '.' +
                _m +
                '.' +
                _p +
                ' because it is already installed';

            const runLog = () => log(installedStr);

            if (M > _M) {
                // console.log('lower major');
                runLog();
                continue;
            } else if (M === _M) {
                // console.log('same major');
                if (m !== undefined && m > _m) {
                    // console.log('lower minor');
                    runLog();
                    continue;
                } else if (m === _m) {
                    // console.log('same minor');
                    // console.log(M, m, p, _M, _m, _p);
                    if (p !== undefined && p >= _p) {
                        // console.log('same patch')
                        runLog();
                        continue;
                    }
                }
            }

            log('Updating database to version', _M + '.' + _m + '.' + _p);

            makeBackup(); // make backup in case of failure

            // retrieve and run sql file
            try {
                const data = Deno.readTextFileSync(
                    resolve(versionDir, sql.name),
                );

                const res = await DB.unsafe.run(data);
                if (res.isErr()) throw res.error;

                // update version
                await DB.unsafe.run(`
                    DELETE FROM Version;
                    INSERT INTO Version (major, minor, patch) VALUES (
                        ${_M},
                        ${_m},
                        ${_p}
                    );
                `);
            } catch (e) {
                error(
                    'Failed to update database to version (sql)',
                    _M + '.' + _m + '.' + _p,
                    e,
                );
                restore([M, m, p]);
                Deno.exit();
            }

            // retrieve and run script if it exists

            const scriptPath = resolve(
                // __root,
                './storage/db/scripts/versions/',
                _M + '-' + _m + '-' + _p + '.ts',
            );

            const script = fs.existsSync(resolve(__root, scriptPath));

            if (script) {
                log('Script found for version', _M + '.' + _m + '.' + _p);
                const status = await runTask(
                    './storage/db/scripts/versions/' +
                        _M +
                        '-' +
                        _m +
                        '-' +
                        _p +
                        '.ts',
                );

                if (status.error) {
                    // status !== 0, script failed
                    log(
                        'Script failed for version',
                        _M + '.' + _m + '.' + _p,
                        'with status code',
                        status.code,
                    );
                    log('Script error:', status.error);
                    log('Restoring database to version', M + '.' + m + '.' + p);
                    restore([M, m, p]);
                    Deno.exit(status.code);
                }
            } else {
                log('No script found for version', _M + '.' + _m + '.' + _p);
            }

            log('Updated database to version', _M + '.' + _m + '.' + _p);
        } else {
            log('Invalid version file', sql.name);
            Deno.exit();
        }
    }
};

if (Deno.args.includes('--update')) init();
