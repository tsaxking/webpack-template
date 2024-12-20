/* eslint-disable no-await-in-loop */
import { readdir } from 'fs/promises';
import { attemptAsync, Result } from '../../../shared/check';
import { Database } from './databases';
import path from 'path';
import { __root } from '../env';

export class VersionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VersionError';
    }
}

/*
After a version change, the database will validate the data in the database to ensure
the schema for a struct is valid.


*/

export class Version {
    public static compare(
        a: [number, number, number],
        b: [number, number, number]
    ) {
        const [aM, am, ap] = a;
        const [bM, bm, bp] = b;
        if (aM > bM) return 'greater';
        if (aM < bM) return 'lower';
        if (am > bm) return 'greater';
        if (am < bm) return 'lower';
        if (ap > bp) return 'greater';
        if (ap < bp) return 'lower';
        return 'equal';
    }

    // TODO: Set up cache
    // static readonly all: Version[] = [];

    public readonly update: (database: Database) => Promise<void>;

    constructor(
        public readonly description: string,
        // version the database is going to
        public readonly version: [number, number, number],
        update: (database: Database) => Promise<void>
    ) {
        this.update = async db => {
            const version = (await db.getVersion()).unwrap();
            if (Version.compare(version, this.version) === 'greater') {
                throw new VersionError(
                    `Database version is greater than the version being updated to`
                );
            }

            await update(db);
        };
    }

    get major() {
        return this.version[0];
    }

    get minor() {
        return this.version[1];
    }

    get patch() {
        return this.version[2];
    }

    get versionStr() {
        return this.version.join('.');
    }

    greaterThan(major: number, minor: number, patch: number, equalTo = false) {
        if (this.major > major) {
            return true;
        }

        if (this.major === major) {
            if (this.minor > minor) {
                return true;
            }

            if (this.minor === minor) {
                if (this.patch > patch) {
                    return true;
                } else if (this.patch === patch && equalTo) {
                    return true;
                }
            }
        }

        return false;
    }

    lessThan(major: number, minor: number, patch: number, equalTo = false) {
        return !this.greaterThan(major, minor, patch, equalTo);
    }

    is(major: number, minor: number, patch: number) {
        return (
            this.major === major && this.minor === minor && this.patch === patch
        );
    }
}

export const getVersions = (): Promise<Result<Version[]>> => {
    return attemptAsync(async () => {
        // if (Version.all.length) {
        //     return Version.all;
        // }

        const files = await readdir(
            path.resolve(__root, './storage/db/scripts/migrations')
        );

        const v = (
            await Promise.all(
                files.map(async file => {
                    const data = (await import(
                        path.resolve(
                            __root,
                            './storage/db/scripts/migrations',
                            file
                        )
                    )) as unknown;

                    const error = new Error(
                        'Invalid version file, must export default type of version'
                    );

                    if (
                        data &&
                        typeof data === 'object' &&
                        Object.keys(data).includes('default')
                    ) {
                        const d = (data as { default: Version }).default;
                        if (d instanceof Version) {
                            return d;
                        }

                        throw error;
                    }
                    throw error;
                })
            )
        ).sort((a, b) => {
            if (a.major !== b.major) {
                return a.major - b.major;
            }

            if (a.minor !== b.minor) {
                return a.minor - b.minor;
            }

            return a.patch - b.patch;
        });

        return v;
    });
};
