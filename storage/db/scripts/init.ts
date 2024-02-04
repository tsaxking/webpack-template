import { DB, Version } from '../../../server/utilities/databases.ts';
import { exists, readDir } from '../../../server/utilities/files.ts';
import { readFile } from '../../../server/utilities/files.ts';
import { attemptAsync, Result } from '../../../shared/check.ts';
import { runTask } from '../../../server/utilities/run-task.ts';

export const init = async (): Promise<Result<void>> => {
    return attemptAsync(async () => {
        if (await DB.hasVersion([0, 0, 0])) {
            console.log('Database already initialized');
            return;
        }

        const initQuery = await readFile('storage/db/queries/db/init.sql');

        if (initQuery.isOk()) {
            const res = await DB.unsafe.run(initQuery.value);
            if (res.isOk()) {
                console.log('Database initialized');
            } else {
                console.log('Error initializing database', res.error);
                throw res.error;
            }
        } else {
            console.log('Error reading init query', initQuery.error);
            throw initQuery.error;
        }
    });
};

export const getUpdates = async (): Promise<Result<Version[]>> => {
    return attemptAsync(async () => {
        const versions = await readDir('storage/db/queries/db/versions');
        if (versions.isOk()) {
            return versions.value.map((v) => {
                const [major, minor, patch] = v.name.replace('.sql', '').split(
                    '-',
                ).map(Number);
                return [major, minor, patch];
            }).sort((a, b) => {
                const [aM, am, ap] = a;
                const [bM, bm, bp] = b;

                if (aM !== bM) {
                    return aM - bM;
                }
                if (am !== bm) {
                    return am - bm;
                }
                return ap - bp;
            }) as Version[];
        }
        return [];
    });
};

export const runUpdate = async (version: Version): Promise<Result<boolean>> => {
    return attemptAsync(async () => {
        const updateQuery = await readFile(
            `storage/db/queries/db/versions/${version.join('-')}.sql`,
        );

        if (updateQuery.isOk()) {
            const currentVersion = await DB.getVersion();
            await makeBackup();

            const res = await DB.unsafe.run(updateQuery.value);
            if (res.isOk()) {
                console.log('Database updated to version', version);

                const script = `storage/db/scripts/versions/${
                    version.join('-')
                }.ts`;
                // see if update script exists
                const scriptExists = await exists(script);

                if (scriptExists) {
                    const scriptRes = await runTask(script);
                    if (scriptRes.isErr()) {
                        console.log(
                            'Error running update script',
                            version,
                            scriptRes.error,
                        );
                        await restoreBackup(currentVersion);
                        throw scriptRes.error;
                    }
                }

                DB.setVersion(version);
                return true;
            } else {
                console.log(
                    'Error updating database to version',
                    version,
                    res.error,
                );
                await restoreBackup(currentVersion);
                throw res.error;
            }
        } else {
            console.log('Error reading update query', updateQuery.error);
            throw updateQuery.error;
        }
    });
};

export const makeBackup = async (): Promise<Result<boolean>> => {
    return attemptAsync(async () => {
        throw new Error('Not implemented');
    });
};

export const setIntervals = async () => {
    // backup each day, delete after 30 days
    return attemptAsync(async () => {
        throw new Error('Not implemented');
    });
};

export const restoreBackup = async (
    _version: Version,
): Promise<Result<boolean>> => {
    return attemptAsync(async () => {
        throw new Error('Not implemented');
    });
};

export const main = async () => {
    const rea = await init();
    if (rea.isOk()) {
        const updates = await getUpdates();
        if (updates.isOk()) {
            for (const version of updates.value) {
                const res = await runUpdate(version);
                if (res.isErr()) {
                    console.log(
                        'There was an error updating the database, it may be corrupted. Please restore from backup, edit the update file, then try again.',
                    );
                    break;
                }
            }
        } else {
            console.log('Error getting updates', updates.error);
        }
    } else {
        console.log('Error initializing database', rea.error);
    }
};

if (import.meta.main) main();
