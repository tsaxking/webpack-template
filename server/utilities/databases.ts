import env, { __root } from './env';
import { error, log } from './terminal-logging';
import { Client } from 'pg';
import { Queries } from './queries';
import {
    exists,
    readDir,
    readFile,
    saveFile,
    log as csv,
    removeFile
} from './files';
import { attempt, attemptAsync, resolveAll, Result } from '../../shared/check';
import {
    capitalize,
    fromCamelCase,
    fromSnakeCase,
    parseObject,
    toCamelCase,
    toSnakeCase
} from '../../shared/text';
import { bigIntDecode, bigIntEncode } from '../../shared/objects';
import { daysTimeout, sleepUntil } from '../../shared/sleep';
import { runTask } from './run-task';
import fs from 'fs';
import path from 'path';
import { SimpleEventEmitter } from '../../shared/event-emitter';
import { gitBranch, gitCommit } from './git';
import { Version as V } from './tables';
import { confirm } from '../../scripts/prompt';
import cliProgress from 'cli-progress';

/**
 * The name of the main database
 * @date 1/9/2024 - 12:08:08 PM
 *
 * @type {*}
 */
const {
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT
} = env;

{
    const cannotConnect =
        'FATAL: Cannot connect to the database, please check your .env file |';

    if (!DATABASE_USER) {
        throw new Error(`${cannotConnect} DATABASE_USER is not defined`);
    }
    if (!DATABASE_PASSWORD) {
        throw new Error(`${cannotConnect} DATABASE_PASSWORD is not defined`);
    }
    if (!DATABASE_NAME) {
        throw new Error(`${cannotConnect} DATABASE_NAME is not defined`);
    }
    if (!DATABASE_HOST) {
        throw new Error(`${cannotConnect} DATABASE_HOST is not defined`);
    }
    if (!DATABASE_PORT) {
        throw new Error(`${cannotConnect} DATABASE_PORT is not defined`);
    }
}

// if (DATABASE_NAME.includes('prod')) {
//     const confirmed = await confirm(
//         Colors.FgRed +
//             'It looks like you are about to connect to a production database, are you sure you want to continue? (yes/no)' +
//             Colors.Reset,
//     );
//     if (!confirmed) {
//         log('Exiting...');
//         process.exit(0);
//     }
// }

/**
 * Acceptable types for a parameter
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @typedef {Parameter}
 */
type Parameter =
    | string
    | number
    | boolean
    | null
    | {
          [key: string]: string | number | boolean | null;
      };

/**
 * All of the parameters that can be used in a query
 * @date 3/8/2024 - 5:37:17 AM
 *
 * @typedef {QParams}
 * @template {keyof Queries} T
 */
type QParams<T extends keyof Queries> = Queries[T][0];

/**
 * The result of a query
 * @date 3/8/2024 - 5:37:17 AM
 *
 * @typedef {QueryResult}
 * @template T
 */
type QueryResult<T> = {
    rows: T[];
    query: string;
    params: unknown[];
};

export class Version {
    /**
     * Retrieves the version of the database (based on the latest update file)
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Version>}
     */
    public static latest() {
        return attemptAsync(async () => {
            return (await Version.getVersions()).unwrap().pop();
        });
    }

    /**
     * Checks if the database is at least the version provided
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {Version} v
     * @returns {Promise<boolean>}
     */
    static async hasVersion(v: Version) {
        return attemptAsync(async () => {
            const current = (await Version.current()).unwrap();
            return current.greaterThan(v, true);
        });
    }

    /**
     * Retrieves all available updates for the database, including those that have already been run
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<Version[]>>}
     */
    static async getVersions(): Promise<Result<Version[]>> {
        return attemptAsync(async () => {
            const versions = await readDir('storage/db/queries/db/versions');
            if (versions.isOk()) {
                return (
                    versions.value
                        .map(v => {
                            const [M, m, p] = v.replace('.sql', '').split('-');
                            return new Version({
                                major: Number(M),
                                minor: Number(m),
                                patch: Number(p),
                                gitBranch: '',
                                gitCommit: ''
                            });
                        })
                        // remove errors
                        // sort by version
                        .sort((a, b) => {
                            return a.greaterThan(b) ? 1 : -1;
                        })
                );
            }
            return [];
        });
    }

    /**
     * Retrieves the version of the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Version>}
     */
    public static current() {
        return attemptAsync(async () => {
            const res = await DB.get('db/get-version');
            if (res.isErr())
                return new Version({
                    major: 0,
                    minor: 0,
                    patch: 0,
                    gitBranch: '',
                    gitCommit: ''
                });
            const v = res.value;
            if (!v) throw new Error('Database version not found');
            return new Version(v);
        });
    }

    public static addGitCols() {
        return DB.unsafe.run(`
                ALTER TABLE Version
                    ADD COLUMN gitBranch TEXT NOT NULL DEFAULT '',
                    ADD COLUMN gitCommit TEXT NOT NULL DEFAULT '';
            `);
    }

    /**
     * Updates the database to a specific version
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {Version} version
     * @returns {Promise<Result<void>>}
     */
    static async updateToVersion(version: Version): Promise<Result<void>> {
        return attemptAsync(async () => {
            (await Version.init()).unwrap();
            const versions = (await Version.getVersions()).unwrap();
            for (const v of versions) {
                // log('Checking version', v, 'against', version, version.greaterThan(version));
                if (version.greaterThan(v, true)) {
                    log('Running update for version', v);
                    (await Version.runUpdate(v)).unwrap();
                }
            }
        });
    }

    /**
     * Initializes the database with the init.sql file
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<void>>}
     */
    static async init(): Promise<Result<void>> {
        return attemptAsync(async () => {
            const v = await Version.current();
            if (v.isOk() && v.value.greaterThan(Version.zero)) {
                return log('Database already initialized');
            }

            const initQuery = await readFile('storage/db/queries/db/init.sql');

            if (initQuery.isOk()) {
                const res = await DB.unsafe.run(initQuery.value);
                if (res.isOk()) {
                    log('Database initialized');
                    await Version.addGitCols();
                } else {
                    log('Error initializing database', res.error);
                    throw res.error;
                }
            } else {
                log('Error reading init query', initQuery.error);
                throw initQuery.error;
            }
        });
    }

    /**
     * Runs a version update on the database
     * If the version doesn't exist or there is an error, the database is restored from a backup
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {Version} version
     * @returns {Promise<Result<boolean>>}
     */
    static async runUpdate(version: Version): Promise<Result<boolean>> {
        return attemptAsync(async () => {
            log('Updating database to version', version.serialize('.'));
            const updateQuery = await readFile(
                `storage/db/queries/db/versions/${version.serialize('-', true)}.sql`
            );

            if (updateQuery.isOk()) {
                const b = await Backup.makeBackup();
                if (b.isErr()) throw b.error;

                const res = await DB.unsafe.run(updateQuery.value);
                if (res.isOk()) {
                    log(
                        'Database updated to version',
                        version.serialize('.', true)
                    );

                    const script = `storage/db/scripts/versions/${version.serialize(
                        '-',
                        true
                    )}.ts`;
                    // see if update script exists
                    const scriptExists = exists(script);

                    if (scriptExists) {
                        log(
                            'Running update script',
                            version.serialize('.', true)
                        );
                        const scriptRes = await runTask('npx', [
                            'ts-node',
                            script,
                            version.serialize('.', true) + '.ts'
                        ]);
                        if (scriptRes.isErr()) {
                            error(
                                'Error running update script',
                                version.serialize('.', true),
                                scriptRes.error
                            );
                            await Backup.restoreBackup(b.value);
                            throw scriptRes.error;
                        }

                        log('Update script ran successfully');
                    }

                    (await Version.set(version)).unwrap();
                    return true;
                }
                error('Error updating database to version', version, res.error);
                await Backup.restoreBackup(b.value);
                throw res.error;
            } else {
                error('Error reading update query', updateQuery.error);
                throw updateQuery.error;
            }
        });
    }

    /**
     * Resets the database to a blank state
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<string>>}
     */
    static async reset() {
        return attemptAsync(async () => {
            let b = await Backup.makeBackup();
            if (b.isErr()) {
                if (b.error.message.includes('not initialized')) {
                    b = b.handle(Backup.zero);
                } else {
                    throw b.error;
                }
            }

            const tables = (await DB.getTables()).unwrap();
            resolveAll(
                await Promise.all(
                    tables.map(table => DB.unsafe.run(`DROP TABLE ${table};`))
                )
            ).unwrap();

            log('Database reset');
            return b.value;
        });
    }

    /**
     * Runs all updates for the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {*}
     */
    static async runAllUpdates() {
        return attemptAsync(async () => {
            (await Version.init()).unwrap();
            const versions = (await Version.getVersions()).unwrap();

            for (const version of versions) {
                log('Version:', version.serialize('.'));
                const has = await Version.hasVersion(version);
                if (has.isErr()) {
                    log('Error checking version', has.error);
                    break;
                }
                if (has.value) {
                    log(
                        'Database already has updated to or version',
                        version.serialize('.')
                    );
                } else {
                    log('Running version update:', version.serialize('.'));
                    const res = await Version.runUpdate(version);
                    if (res.isErr()) {
                        log(
                            'There was an error updating the database, it may be corrupted. Please restore from backup, edit the update file, then try again.'
                        );
                        break;
                    }
                }
            }
        });
    }

    /**
     * Sets the version of the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {Version} v
     * @returns {Promise<Result<unknown>>}
     */
    public static set(v: Version) {
        return attemptAsync(async () => {
            log('Setting version to', v.serialize('.'));

            (await DB.run('db/delete-version')).unwrap();
            return (await DB.run('db/change-version', v)).unwrap();
        });
    }

    public static from(str: string, deilimiter: string) {
        return attempt(() => {
            str = str.replaceAll('.json', '');
            const [major, minor, patch, gitBranch, gitCommit] =
                str.split(deilimiter);
            if (isNaN(Number(major)))
                throw new Error('Major version is not a number');
            if (isNaN(Number(minor)))
                throw new Error('Minor version is not a number');
            if (isNaN(Number(patch)))
                throw new Error('Patch version is not a number');
            return new Version({
                major: Number(major),
                minor: Number(minor),
                patch: Number(patch),
                gitBranch,
                gitCommit
            });
        });
    }

    public static get zero() {
        return new Version({
            major: 0,
            minor: 0,
            patch: 0,
            gitBranch: 'main',
            gitCommit: '0000000'
        });
    }

    major: number;
    minor: number;
    patch: number;
    gitBranch: string;
    gitCommit: string;

    constructor(v: V) {
        this.major = v.major;
        this.minor = v.minor;
        this.patch = v.patch;
        this.gitBranch = (v.gitBranch || '').replaceAll('-', '');
        this.gitCommit = v.gitCommit || '';
    }

    serialize(delimiter: string, min = false) {
        if (min) {
            return [this.major, this.minor, this.patch].join(delimiter);
        }
        return [
            this.major,
            this.minor,
            this.patch,
            this.gitBranch,
            this.gitCommit
        ].join(delimiter);
    }

    greaterThan(v: Version, equalTo = false) {
        log(this, v);
        if (this.major > v.major) {
            // log('this.major > v.major');
            return true;
        }
        // log('this.major <= v.major');

        if (this.major === v.major) {
            if (this.minor > v.minor) {
                // log('this.minor > v.minor');
                return true;
            }
            // log('this.minor <= v.minor');

            if (this.minor === v.minor) {
                if (this.patch > v.patch) {
                    // log('this.patch > v.patch');
                    return true;
                } else if (this.patch === v.patch && equalTo) {
                    // log('this.patch === v.patch');
                    return true;
                }
            }
        } else {
            // log('this.major <= v.major');
        }

        return false;
    }
}

export class Backup extends Version {
    public static from(str: string) {
        return attempt(() => {
            str = str.replaceAll('.json', '');
            const [v, date] = str.split('_');
            return new Backup(Version.from(v, '-').unwrap(), Number(date));
        });
    }

    /**
     * Retrieves all backups available for the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<string[]>>}
     */
    static async getBackups(): Promise<Result<Backup[]>> {
        return attemptAsync(async () => {
            const version = (await Version.current()).unwrap();

            log('Getting backups for version', version.serialize('.'));

            const backups = (await readDir('storage/db/backups'))
                .unwrap()
                .map(b => b.replace('.json', ''));

            return backups
                .map(Backup.from)
                .filter(b => b.isOk())
                .map(b => b.unwrap())
                .filter(b => b.gitBranch === version.gitBranch);
        });
    }

    static async latest() {
        return attemptAsync(async () => {
            const backups = (await Backup.getBackups()).unwrap();
            if (!backups.length) return undefined;
            return backups.pop();
        });
    }

    /**
     * Creates a full backup of the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<string>>}
     */
    static async makeBackup() {
        return attemptAsync(async () => {
            const [tables, version] = await Promise.all([
                DB.getTables(),
                Version.current()
            ]);

            // if (['-1.-1.-1'].includes(version.join('.'))) {
            //     throw new Error('Database not initialized, no backup created');
            // }

            const t = tables.unwrap();
            const v = version.unwrap();
            const backup: {
                [table: string]: unknown[]; // table name: rows
            } = {};

            // pull all data from each table
            await Promise.all(
                t.map(async table => {
                    const data = await DB.unsafe.all(`SELECT * FROM ${table}`);
                    if (data.isOk()) backup[table] = data.value;
                    else throw data.error;
                })
            );

            const copy = bigIntEncode(backup);
            const str = JSON.stringify(copy, null, 2);
            const b = new Backup(v, Date.now());
            const name = `${b.serialize()}.json`;

            const res = await saveFile('storage/db/backups/' + name, str);
            if (res.isOk()) {
                log('Backup created:', name);
                return b;
            }
            log('Error creating backup', res.error);
            throw res.error;
        });
    }

    /**
     * Restores the database from a backup
     * This will reset the database, update it to the version of the backup, then insert the data from the backup
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {string} backupName
     * @returns {Promise<Result<void>>}
     */
    static async restoreBackup(backup: Backup): Promise<Result<void>> {
        return attemptAsync(async () => {
            const currentVersion = (await Version.current()).unwrap();
            if (currentVersion.gitBranch !== backup.gitBranch) {
                const confirmed = await confirm(
                    'Are you sure you want to restore backup from a different branch?'
                );
                if (!confirmed)
                    throw new Error(
                        'Cannot restore backup from a different branch'
                    );
                if (!confirmed)
                    throw new Error(
                        'Cannot restore backup from a different branch'
                    );
            }
            const currentBackup = (await Backup.makeBackup()).unwrap();

            const resetRes = await Version.reset();
            if (resetRes.isErr()) {
                log('Error resetting database', resetRes.error);
                log(
                    'Reinitializing database, and restoring its current version...'
                );

                const updateRes = await Version.updateToVersion(currentVersion);
                if (updateRes.isErr()) throw updateRes.error;
                const restoreRes = await Backup.restoreBackup(currentBackup);
                if (restoreRes.isErr()) throw restoreRes.error;
                throw resetRes.error;
            }

            const updateRes = await Version.updateToVersion(backup);
            if (updateRes.isErr()) throw updateRes.error;
            log('Update successful');

            const versionNow = (await Version.current()).unwrap();
            log('Version after updates:', versionNow.serialize('.'));

            const ts = (await DB.getTables()).unwrap();
            log('Tables after updates:', ts);

            console.log('Filename:', backup.serialize());

            const file = (
                await readFile(`storage/db/backups/${backup.serialize()}.json`)
            ).unwrap();

            log('Retrieved file:', file.length);

            const data = bigIntDecode(JSON.parse(file)) as {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [table: string]: any[];
            };

            const tables = Object.keys(data);

            const multibar = new cliProgress.MultiBar(
                {
                    clearOnComplete: false,
                    hideCursor: true,
                    format: '{bar} | {percentage}% | {value}/{total} | {table}'
                },
                cliProgress.Presets.shades_classic
            );

            log('Inserting...', tables);
            const res = await Promise.all(
                tables.map(async table => {
                    const res = await attemptAsync(async () => {
                        const rows = data[table];
                        const bar = multibar.create(rows.length, 0, { table });
                        let current = 0;

                        const cols = Object.keys(rows[0] || {});
                        if (!cols.length) return; // no data to insert

                        const colNames = cols.join(', ');
                        const colVals = cols.map(c => `:${c}`).join(', ');

                        return Promise.all(
                            rows.map(async r => {
                                const q = `INSERT INTO ${table} (${colNames}) VALUES (${colVals})`;
                                const res = await DB.unsafe.run(q, r);

                                if (res.isErr()) {
                                    error(
                                        'Error inserting data into',
                                        table,
                                        res.error,
                                        q,
                                        r
                                    );
                                }

                                current++;

                                bar.update(current, { filename: table });

                                return res;
                            })
                        );
                    });

                    if (res.isErr()) throw res.error;
                    if (res.value?.some(r => r.isErr())) {
                        error('Error inserting data');
                        throw new Error('Error inserting data');
                    }
                    return res;
                })
            );

            multibar.stop();

            if (res.every(r => r.isOk())) {
                log('Database restored');
            } else {
                // log('Error(s) restoring database', res);
                throw new Error('Error(s) restoring database');
            }
        });
    }

    public static get zero() {
        return new Backup(Version.zero, 0);
    }

    date: number;
    constructor(v: V, date: number) {
        super(v);
        this.date = date;
    }

    serialize() {
        return `${super.serialize('-')}_${this.date}`;
    }

    greaterThan(b: Backup, equalTo = false) {
        if ((super.greaterThan(b), equalTo)) return true;
        return equalTo ? this.date >= b.date : this.date > b.date;
    }

    open() {
        return attemptAsync(async () => {
            const res = await readFile(
                `storage/db/backups/${this.serialize()}.json`
            );
            if (res.isErr()) throw res.error;
            return JSON.parse(res.value);
        });
    }
}

/**
 * Database class
 * @date 10/12/2023 - 3:24:19 PM
 *
 * @export
 * @class DB
 * @typedef {DB}
 */
export class DB {
    /**
     * Database instance
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly db = new Client({
        user: DATABASE_USER,
        database: DATABASE_NAME,
        host: DATABASE_HOST,
        password: DATABASE_PASSWORD,
        port: Number(DATABASE_PORT),
        keepAlive: true
    });

    /**
     * Database event emitter, used for connecting and disconnecting
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly em = new SimpleEventEmitter<'connect' | 'disconnect'>();

    /**
     * Connects to the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {unknown}
     */
    static async connect() {
        return attemptAsync(async () => {
            return DB.db.connect();
        });
    }

    /**
     * Disconnects from the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @public
     * @static
     * @async
     * @returns {unknown}
     */
    public static async disconnect() {
        // await Promise.all(DB.stack); // wait for all queries to end
        // DB.stack = [];
        log('Closing database...');
        return DB.db.end();
    }

    public static async vacuum() {
        return attemptAsync(async () => {
            log('Vacuum go brrrrrrr');
            const tables = await DB.getTables();
            if (tables.isErr()) throw tables.error;
            return Promise.all(
                tables.value.map(async table => {
                    DB.unsafe.run(`VACUUM ${table};`);
                })
            );
        });
    }

    /**
     * Parses a query and converts it to a format that the database can understand
     * All :variables are replaced with $n, and all ? are replaced with $n
     * With this, it's easy to switch between different database hosts
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @public
     * @static
     * @param {string} query
     * @param {any[]} args
     * @returns {[string, Parameter[]]}
     */
    public static parseQueryVariables(
        query: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: any[]
    ): [string, Parameter[]] {
        const copied = [...args]; // no dependencies

        // remove all comments
        query = query.replaceAll(/--.*\n/g, '');

        const deCamelCase = (str: string) =>
            str.replace(
                /[A-Z]*[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/g,
                word => {
                    // log(toSnakeCase(fromCamelCase(word)));
                    let w = toSnakeCase(fromCamelCase(word));
                    if (w.startsWith('_')) {
                        w = w.slice(1);
                        // capitalize first letter
                        // w = w.charAt(0).toUpperCase() + w.slice(1);
                    }
                    return w;
                }
            );

        const qMatches = query.match(/\?/g);

        if (qMatches) {
            if (qMatches.length !== args.length) {
                throw new Error(
                    `Number of parameters does not match number of ? in query. Query: ${query}, Parameters: ${copied}`
                );
            }
            // replace each ? with a $n
            for (let i = 0; i < qMatches.length; i++) {
                query = query.replace('?', `$${i + 1}`);
            }
            return [deCamelCase(query), copied];
        }

        // get every :variable in the query
        const matches = query.match(/:\w+/g);
        // log(matches);
        const newArgs: Parameter[] = [];
        if (matches) {
            // for each match, replace it with a $n
            for (let i = 0; i < matches.length; i++) {
                query = query.replace(matches[i], `$${i + 1}`);
                newArgs.push(
                    copied[0]
                        ? copied[0][matches[i].replace(/:/g, '')]
                        : copied[i]
                );
            }
            return [deCamelCase(query), newArgs];
        }

        return [deCamelCase(query), copied];
    }

    /**
     * Postgres doesn't like capitalized table names, so we convert them to snake case.
     * But this entire codebase uses camel case, so we convert them back to camel case
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @private
     * @static
     * @template {object} T
     * @param {T} obj
     * @returns {*}
     */
    private static parseObj<T extends object>(obj: T) {
        return parseObject(obj, str => toCamelCase(fromSnakeCase(str)));
    }

    /**
     * Retrieves all postgres owners from the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<string[]>>}
     */
    static async getUsers(): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            // get all users for the postgres database
            const res = await DB.unsafe.all<{ rolname: string }>(
                `
                SELECT rolname
                FROM pg_roles
                WHERE rolname != 'postgres'
                ORDER BY rolname;
            `
            );

            if (res.isOk()) {
                return res.value.map(r => r.rolname);
            }
            throw res.error;
        });
    }

    /**
     * Backs up the database periodically
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {unknown}
     */
    static async setIntervals() {
        const { BACKUP_INTERVAL, BACKUP_DAYS } = env;
        if (!BACKUP_INTERVAL || !BACKUP_DAYS) {
            log(
                'BACKUP_INTERVAL or BACKUP_DAYS not set, skipping backup intervals'
            );
            return;
        }
        const now = Date.now();

        log(
            'Setting backup intervals to create every',
            BACKUP_INTERVAL,
            'hours, and delete after',
            BACKUP_DAYS,
            'days'
        );

        // backup each day, delete after 30 days
        return attemptAsync(async () => {
            const backups = await Backup.getBackups();
            if (backups.isErr()) throw new Error('Could not find backups');

            log(
                'Setting backup intervals to delete every',
                BACKUP_DAYS,
                'days'
            );

            const setDelete = (backup: Backup, days: number) => {
                daysTimeout(() => {
                    log('Deleting backup:', backup);
                    removeFile(`storage/db/backups/${backup.serialize()}`);
                }, days);
            };

            // creates a backup every BACKUP_INTERVAL hours
            setInterval(
                async () => {
                    log('Creating automated database backup...');
                    const res = await Backup.makeBackup();
                    if (res.isOk()) {
                        setDelete(res.value, +BACKUP_DAYS);
                    } else {
                        log('Error creating backup', res.error);
                    }
                },
                +BACKUP_INTERVAL * 60 * 60 * 1000
            );

            for (const b of backups.value) {
                const { date: time } = b;
                const date = new Date(+time);
                const deleteDate = new Date(+time).setDate(
                    date.getDate() + +BACKUP_DAYS
                );

                if (deleteDate < now) {
                    log('Deleting backup:', b);
                    await removeFile(`storage/db/backups/${b}`);
                } else {
                    setDelete(b, +BACKUP_DAYS);
                }
            }
        });
    }

    /**
     * Set up database cleanup intervals
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {unknown}
     */
    static async setClearBackups() {
        return attemptAsync(async () => {
            if (!env.BACKUP_DAYS) {
                log('No backup days set, skipping backup clearing');
                return;
            }
            const backups = await Backup.getBackups();
            if (backups.isErr()) throw backups.error;

            for (const b of backups.value) {
                const { date: time } = b;

                const date = new Date(+time);
                const deleteDate = date.setDate(
                    date.getDate() + Number(env.BACKUP_DAYS)
                );

                if (deleteDate < Date.now()) {
                    log('Deleting backup:', b);
                    await removeFile(`storage/db/backups/${b}`);
                }

                // delete after 30 days
                sleepUntil(() => {
                    log('Deleting backup:', b);
                    removeFile(`storage/db/backups/${b}`);
                }, new Date(deleteDate));
            }
        });
    }

    /**
     * Returns all tables available in the database
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @returns {Promise<Result<string[]>>}
     */
    static async getTables(): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            const res = await DB.unsafe.all<{ tableName: string }>(
                `
                -- get all tables available in the env.DATABASE_NAME
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `
            );

            if (res.isOk()) {
                return res.value.map(r =>
                    capitalize(toCamelCase(fromSnakeCase(r.tableName)))
                );
            }
            throw res.error;
        });
    }

    /**
     * Returns all columns in a given table
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @param {string} table
     * @returns {Promise<Result<string[]>>}
     */
    static async getTableCols(table: string): Promise<Result<string[]>> {
        return attemptAsync(async () => {
            const res = await DB.unsafe.all<{ columnName: string }>(
                `
                -- get all columns in a table
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = :table
                ORDER BY column_name;
            `,
                { table }
            );

            if (res.isOk()) {
                return res.value.map(r =>
                    toCamelCase(fromSnakeCase(r.columnName))
                );
            }
            throw res.error;
        });
    }

    /**
     * Prepares a static query
     * This will read the query from the file system and prepare it for running
     *
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @private
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     */
    private static async prepare<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<[string, Parameter[]]>> {
        return attemptAsync(async () => {
            const sql = fs.readFileSync(
                path.resolve(
                    __dirname,
                    '../../storage/db/queries/' + type + '.sql'
                ),
                'utf-8'
            );
            const [parsedQuery, parsedArgs] = DB.parseQueryVariables(sql, args);
            return [parsedQuery, parsedArgs] as [string, Parameter[]];
        });
    }

    /**
     * Runs a query
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @private
     * @static
     * @async
     * @param {string} query
     * @param {Parameter[]} args
     * @returns {Promise<Result<QueryResult<unknown>>>}
     */
    private static async runQuery(
        query: string,
        args: Parameter[]
    ): Promise<Result<QueryResult<unknown>>> {
        const start = Date.now();

        await DB.connect();
        const run = () =>
            attemptAsync(async () => {
                const q = DB.parseQueryVariables(query, args);
                const [sql, newArgs] = q;

                const result = await DB.db.query(sql, newArgs as unknown[]);

                return {
                    rows: bigIntDecode(DB.parseObj(result.rows) as unknown[]),
                    params: newArgs,
                    query: sql
                };
            });

        const res = await run();

        if (res.isErr()) {
            error('Error running query:', query, args, res.error);
        }

        const time = Date.now() - start;

        csv('queries', {
            date: Date.now(),
            query: query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
            duration: time
        });

        return res;
    }

    /**
     * Pipes a query through the prepare and runQuery functions
     * @date 1/9/2024 - 12:08:08 PM
     *
     * @private
     * @static
     * @template {keyof Queries} T
     * @param {('run' | 'get' | 'all')} type
     * @param {T} query
     * @param {...Queries[T][0]} args
     * @returns {(Queries[T][1] | undefined)}
     */
    private static pipeSafe<T extends keyof Queries>(
        query: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<QueryResult<Queries[T][1]>>> {
        return attemptAsync(async () => {
            const q = await DB.prepare(query, ...args);
            if (q.isErr()) {
                error('Error preparing query:', q.error);
                throw q.error;
            }

            const [newQuery, newArgs] = q.value;
            const result = await DB.runQuery(newQuery, newArgs);

            if (result.isErr()) {
                throw result.error;
            }

            return result.value;
        });
    }

    /**
     * Pipes a query through the prepare and runQuery functions (for unsafe queries)
     * @date 3/8/2024 - 5:37:17 AM
     *
     * @static
     * @async
     * @template [T=unknown]
     * @param {string} query
     * @param {...Parameter[]} args
     * @returns {Promise<Result<QueryResult<T>>>}
     */
    static async pipeUnsafe<T = unknown>(
        query: string,
        ...args: Parameter[]
    ): Promise<Result<QueryResult<T>>> {
        return attemptAsync(async () => {
            const [q, p] = DB.parseQueryVariables(query, args);

            const result = await DB.runQuery(q, p);

            if (result.isErr()) {
                throw result.error;
            }

            return result.value as QueryResult<T>;
        });
    }

    /**
     * Runs a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {number}
     */
    static async run<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1]>> {
        return attemptAsync(async () => {
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                error(q.error);
                throw q.error;
            }
            return q.value.rows?.[0] as Queries[T][1];
        });
    }

    /**
     * Gets the first result of a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {(Queries[T][1] | undefined)}
     */
    static get<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1] | undefined>> {
        return attemptAsync(async () => {
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                error(q.error);
                throw q.error;
            }
            return q.value.rows[0];
        });
    }

    /**
     * Gets all results of a query
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @template {keyof Queries} T
     * @param {T} type
     * @param {...Queries[T][0]} args
     * @returns {Queries[T][1][]}
     */
    static all<T extends keyof Queries>(
        type: T,
        ...args: QParams<T> extends [undefined] ? [] : QParams<T>
    ): Promise<Result<Queries[T][1][]>> {
        return attemptAsync(async () => {
            const q = await DB.pipeSafe(type, ...args);
            if (q.isErr()) {
                error(q.error);
                throw q.error;
            }
            return q.value.rows;
        });
    }

    /**
     * Runs a query without preparing it (only used for in-line queries)
     * Don't use this unless you know what you're doing. This should only be used for scripts, and never in the main server.
     * @date 10/12/2023 - 3:24:19 PM
     *
     * @static
     * @readonly
     * @type {{ run: (query: string, ...args: {}) => number; get: <type = unknown>(query: string, ...args: {}) => any; all: <type>(query: string, ...args: {}) => {}; }}
     */
    static get unsafe() {
        return {
            run: (
                query: string,
                ...args: Parameter[]
            ): Promise<Result<void>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        error(r.error);
                        throw r.error;
                    }
                });
            },
            get: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type | undefined>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        error(r.error);
                        throw r.error;
                    }
                    return r.value.rows[0] as type;
                });
            },
            all: <type = unknown>(
                query: string,
                ...args: Parameter[]
            ): Promise<Result<type[]>> => {
                return attemptAsync(async () => {
                    const r = await DB.pipeUnsafe(query, ...args);
                    if (r.isErr()) {
                        error(r.error);
                        throw r.error;
                    }
                    return r.value.rows as type[];
                });
            }
        };
    }
}

/**
 * Runs all updates for the database
 * @date 3/8/2024 - 5:37:17 AM
 *
 * @returns {*}
 */
export const run = () => {
    return attemptAsync(async () => {
        await Version.init();
        await Version.addGitCols();

        const [branch, commit, version] = await Promise.all([
            gitBranch(),
            gitCommit(),
            Version.current()
        ]);

        const b = branch.unwrap().replaceAll('-', '');
        const c = commit.unwrap();

        let v: Version;
        if (version.isErr()) {
            // there is likely an issue with gitBranch and gitCommit
            DB.unsafe.run(
                `
                UPDATE Version
                SET gitBranch = :branch, gitCommit = :commit;
            `,
                {
                    branch: b,
                    commit: c
                }
            );

            v = (await Version.current()).unwrap();
        } else v = version.value;

        const setBranch = async () =>
            (
                await Version.set(
                    new Version({
                        ...v,
                        gitBranch: b,
                        gitCommit: c
                    })
                )
            ).unwrap();

        if (v.gitBranch !== '' && b !== v.gitBranch) {
            const confirmed =
                process.argv.includes('branch-reset') ||
                (await confirm(
                    `Database branch does not match current branch
Current git branch: ${b}
Database git branch: ${v.gitBranch}
Do you want to reset the database and update to the current branch?`
                ));
            if (confirmed) {
                await Version.reset();
                await Version.runAllUpdates();
                await setBranch();

                const backups = (await Backup.getBackups()).unwrap().reverse();
                const [b] = backups;

                if (b) {
                    const confirmed = await confirm(
                        `Do you want to restore the latest backup? ${b.serialize()}`
                    );
                    if (confirmed) await Backup.restoreBackup(b);
                    await Version.runAllUpdates();
                } else {
                    throw new Error('Backups not found');
                }
            } else {
                await Version.runAllUpdates();
                await Backup.makeBackup();
                await setBranch();
            }
        } else {
            await Version.runAllUpdates();
            await setBranch();
        }

        await DB.setIntervals();

        DB.vacuum();
        setInterval(DB.vacuum, 5 * 1000 * 60);
    });
};

DB.connect()
    .then(async () => {
        log('Connected to the database');
        (await run()).unwrap();
        DB.em.emit('connect');

        const close = async () => {
            // await Promise.all(DB.stack);
            await DB.disconnect();
            process.exit(0);
        };

        process.on('SIGINT', close);
        process.on('SIGTERM', close);
    })
    .catch(e => {
        error('Error connecting to the database', e);
        process.exit(1);
    });
