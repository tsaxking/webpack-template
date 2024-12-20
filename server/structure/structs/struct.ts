/* eslint-disable no-dupe-class-members */
import { attempt, attemptAsync, Result } from '../../../shared/check';
import {
    Database,
    Parameter,
    Query,
    SimpleParameter
} from '../../utilities/database/databases';
import { uuid } from '../../utilities/uuid';
import { Route, ServerFunction } from '../app/app';
import { match } from '../../../shared/match';
import { validate } from '../../middleware/data-type';
import { Status } from '../../utilities/status';
import { EventEmitter } from '../../../shared/event-emitter';
import { Req } from '../app/req';
import { capitalize, decode, encode } from '../../../shared/text';
import fs from 'fs';
import path from 'path';
import {
    SQL_Type,
    TS_Type,
    type,
    typeValidation,
    TS_TypeStr,
    TS_TypeActual,
    GlobalCols,
    Blank,
    PropertyAction,
    DataAction
} from '../../../shared/struct';
import { Loop } from '../../../shared/loop';
import { log } from '../../utilities/terminal-logging';
import { Version } from '../../utilities/database/versions';

/**
 * Prove that the data matches the structure
 *
 * @template {Blank} T
 * @template D
 * @template {string} Name
 * @param {D} data
 * @param {Blank} structure
 * @returns {Result<boolean>}
 */
export const prove = <T extends Blank, D, Name extends string>(
    data: D,
    structure: Blank
): Result<boolean> => {
    return attempt(() => {
        if (!data || typeof data !== 'object') {
            return false;
        }

        const keys = Object.keys(data);
        if (keys.length === 0) {
            return false;
        }

        const keysMatch = keys.every(k => Object.keys(structure).includes(k));
        if (!keysMatch) {
            return false;
        }

        const typesMatch = keys.every(k => {
            const type = structure[k];
            const value = (data as Record<string, unknown>)[k];
            if (
                type === 'integer' ||
                type === 'bigint' ||
                type === 'real' ||
                type === 'numeric'
            ) {
                return typeof value === 'number';
            } else if (type === 'text') {
                return typeof value === 'string';
            } else if (type === 'boolean') {
                return typeof value === 'boolean';
            }
            return false;
        });

        return typesMatch as D extends St<T, Name> ? true : false;
    });
};

/**
 * Error class for when there's an issue with a struct
 *
 * @export
 * @class StructError
 * @typedef {StructError}
 * @extends {Error}
 */
export class StructError extends Error {
    /**
     * Creates an instance of StructError.
     *
     * @constructor
     * @param {string} message
     */
    constructor(message: string) {
        super(message);
        this.name = 'StructError';
    }
}

/**
 * Error class for when there's an issue with data
 *
 * @export
 * @class DataError
 * @typedef {DataError}
 * @extends {Error}
 */
export class DataError extends Error {
    /**
     * Creates an instance of DataError.
     *
     * @constructor
     * @param {string} message
     */
    constructor(message: string) {
        super(message);
        this.name = 'DataError';
    }
}

/**
 * Fatal error class for when there's an issue with a struct (this should be used when the program is not recoverable)
 *
 * @export
 * @class FatalStructError
 * @typedef {FatalStructError}
 * @extends {StructError}
 */
export class FatalStructError extends StructError {
    /**
     * Creates an instance of FatalStructError.
     *
     * @constructor
     * @param {string} message
     */
    constructor(message: string) {
        super(message);
        this.name = 'FatalStructError';
    }
}

/**
 * Fatal error class for when there's an issue with data (this should be used when the program is not recoverable)
 *
 * @export
 * @class FatalDataError
 * @typedef {FatalDataError}
 * @extends {DataError}
 */
export class FatalDataError extends DataError {
    /**
     * Creates an instance of FatalDataError.
     *
     * @constructor
     * @param {string} message
     */
    constructor(message: string) {
        super(message);
        this.name = 'FatalDataError';
    }
}

export class StructMigrationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StructMigrationError';
    }
}

/*
Questions:
- Say I want to emit only to a specific room, how would this be configured?
    - Should I have a room for each emittable action?
*/

/**
 * Object passed in to build the struct
 *
 * @typedef {StructBuilder}
 * @template {Blank} T
 * @template {string} Name
 */
type StructBuilder<T extends Blank, Name extends string> = {
    /**
     * Struct name (must be unique, this will be the table name in the database)
     */
    name: Name;
    // TODO: implement complex types
    // TODO: Implement json types
    /**
     * Structure of the data
     */
    structure: T; // omit id because it will always be included as a uuid primary key
    /**
     * Database instance to use
     */
    database: Database;
    /**
     * Version history settings
     */
    versionHistory?: {
        type: 'days' | 'versions';
        amount: number;
    };
    /**
     * Default generators for allowed global cols
     */
    generators?: Partial<{
        id: () => string;
        attributes: () => string[];
    }>;
    // defaults?: Structable<Struct<T, Name>>[];
    // permissions?:
    /**
     * If this is a sample struct, only used for testing
     * If a sample struct is built, it will crash the program
     *
     * @type {?boolean}
     */
    sample?: boolean;
    /**
     * Limit of universes this struct's is allowed to be in
     */
    universeLimit?: number;
    /**
     * Time (in milliseconds) for how long a data in this struct should last
     */
    lifetime?: number;
    validators?: {
        [K in keyof T]?: Validator<T[K]>;
    };
    loop?: {
        fn: (struct: Struct<T, Name>) => void;
        time: number;
    };
    frontend?: boolean;
    makeImage?: boolean; // default true
    defaultUniverses?: string[];
};

type Validator<T extends SQL_Type> = (data: TS_Type<T>) => boolean;

type StructImage<T extends Blank> = {
    name: string;
    structure: T;
    defaults?: Structable<Struct<Blank, string>>[];
    versionHistory?: {
        type: 'days' | 'versions';
        amount: number;
    };
};

/**
 * Generates the new global columns for a struct
 *
 * @param {Struct<Blank, string>} struct
 * @returns {{ id: any; created: any; updated: any; archived: boolean; attributes: any; universes: string; }}
 */
const newGlobalCols = (struct: Struct<Blank, string>) => {
    return {
        id: struct.data.generators?.id?.() || uuid(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        archived: false,
        attributes:
            struct.data.generators
                ?.attributes?.()
                .map(a => a.replaceAll(',', ''))
                .join(',') || '',
        universes: '[]',
        lifetime: struct.data.lifetime || 0
    };
};

/**
 * Struct column
 * Used to define the type of a column in a struct
 * Will eventually be used to generate SQL
 *
 * @export
 * @class Column
 * @typedef {Column}
 * @template {SQL_Type} Type
 * @template {Blank} StructType
 * @template {string} Name
 */
export class Column<
    Type extends SQL_Type,
    StructType extends Blank,
    Name extends string
> {
    /**
     * Type of the column
     *
     * @public
     * @readonly
     * @type {TS_TypeStr<Type>}
     */
    public readonly type: TS_TypeStr<Type>;

    /**
     * Creates an instance of Column.
     *
     * @constructor
     * @param {string} name
     * @param {SQL_Type} sqlType
     * @param {Struct<StructType, Name>} struct
     */
    constructor(
        public readonly name: string,
        public readonly sqlType: SQL_Type,
        public readonly struct: Struct<StructType, Name>
    ) {
        this.type = match<SQL_Type, TS_TypeStr<typeof this.sqlType>>(
            this.sqlType
        )
            .case('integer', () => 'number')
            .case('bigint', () => 'number')
            .case('text', () => 'string')
            .case('boolean', () => 'boolean')
            .case('real', () => 'number')
            .case('numeric', () => 'number')
            .default(() => 'unknown')
            .exec()
            .unwrap() as TS_TypeStr<Type>;
    }
}

/**
 * Map of columns for a struct
 *
 * @export
 * @typedef {ColMap}
 * @template {{
 *         [key: string]: SQL_Type;
 *     }} Cols
 * @template {string} Name
 */
export type ColMap<
    Cols extends {
        [key: string]: SQL_Type;
    },
    Name extends string
> = {
    [K in keyof Cols]: Column<Cols[K], Cols, Name>;
};

/**
 * Structable that is used to create data
 * This isn't to be used outside of this file
 *
 * @typedef {St}
 * @template {Blank} T
 * @template {string} Name
 */
type St<T extends Blank, Name extends string> = {
    [K in keyof T]: TS_TypeActual<Column<T[K], T, Name>['type']>;
};

/**
 * Partial Structable that is used after filtering data based on permissions
 *
 * @export
 * @typedef {PartialStructable}
 * @template {Struct<Blank, string>} SubStruct
 */
export type PartialStructable<SubStruct extends Struct<Blank, string>> =
    Partial<St<SubStruct['data']['structure'], SubStruct['data']['name']>> &
        St<GlobalCols, SubStruct['data']['name']>;

/**
 * The type used to generate data inside a struct
 *
 * @export
 * @typedef {Structable}
 * @template {Struct<Blank, string>} SubStruct
 */
export type Structable<SubStruct extends Struct<Blank, string>> = St<
    SubStruct['data']['structure'] & GlobalCols,
    SubStruct['data']['name']
>;
/**
 * The type used to generate data inside a struct without the global columns
 *
 * @export
 * @typedef {BasicStructable}
 * @template {Struct<Blank, string>} SubStruct
 */
export type BasicStructable<SubStruct extends Struct<Blank, string>> = St<
    SubStruct['data']['structure'],
    SubStruct['data']['name']
>;

/**
 * Interface that versions and data must implement
 *
 * @export
 * @interface DataInterface
 * @typedef {DataInterface}
 * @template {Struct<Blank, string>} S
 */
export interface DataInterface<S extends Struct<Blank, string>> {
    /**
     * Data ID
     *
     * @readonly
     * @type {string}
     */
    get id(): string;
    /**
     * When the data was created
     *
     * @readonly
     * @type {Date}
     */
    get created(): Date;
    /**
     * When the data was last updated
     *
     * @readonly
     * @type {Date}
     */
    get updated(): Date;
    /**
     * If the data is archived
     *
     * @readonly
     * @type {boolean}
     */
    get archived(): boolean;
    /**
     * Database instance
     *
     * @readonly
     * @type {Database}
     */
    get database(): Database;
    /**
     * The actual data
     *
     * @type {Readonly<St<S['data']['structure'] & GlobalCols, S['data']['name']>>}
     */
    data: Readonly<St<S['data']['structure'] & GlobalCols, S['data']['name']>>;

    /**
     * Struct instance
     *
     * @type {S}
     */
    struct: S;

    /**
     * Retrieves the universes the data is in
     *
     * @returns {Result<string[]>}
     */
    getUniverses(): Result<string[]>;
}

/**
 * Version of the data (only used when versionHistory on a struct exists)
 *
 * @export
 * @class DataVersion
 * @typedef {DataVersion}
 * @template {Blank} T
 * @template {string} Name
 * @implements {DataInterface<Struct<T, Name>>}
 */
export class DataVersion<T extends Blank, Name extends string>
    implements DataInterface<Struct<T, Name>>
{
    /**
     * Creates an instance of DataVersion.
     *
     * @constructor
     * @param {Struct<T, Name>} struct
     * @param {St<
     *             T &
     *                 GlobalCols & {
     *                     vhId: 'text';
     *                     vhCreated: 'text';
     *                 },
     *             Name
     *         >} data
     */
    constructor(
        public readonly struct: Struct<T, Name>,
        public readonly data: St<
            T &
                GlobalCols & {
                    vhId: 'text';
                    vhCreated: 'text';
                },
            Name
        >
    ) {}

    /**
     * Version history id
     *
     * @readonly
     * @type {TS_TypeActual<(T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["vhId"] extends "integer" ? "number" : (T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["vhId"] extends "bigint" ? "number" : (T & ... 1 more ... & { ...; })["vhId"] extends "text" ? "string" : (T & ... 1 more ... & { ...; })["vhId"] extend...}
     */
    get vhId() {
        return this.data.vhId;
    }

    /**
     * When the version was created
     *
     * @readonly
     * @type {*}
     */
    get vhCreated() {
        return new Date(this.data.vhCreated);
    }

    /**
     * Data id (there can be multiple versions of the same data)
     *
     * @readonly
     * @type {TS_TypeActual<(T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["id"] extends "integer" ? "number" : (T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["id"] extends "bigint" ? "number" : (T & ... 1 more ... & { ...; })["id"] extends "text" ? "string" : (T & ... 1 more ... & { ...; })["id"] extends "json"...}
     */
    get id() {
        return this.data.id;
    }

    /**
     * The date the data was created
     *
     * @readonly
     * @type {*}
     */
    get created() {
        return new Date(this.data.created);
    }

    /**
     * The date the data was last updated
     *
     * @readonly
     * @type {*}
     */
    get updated() {
        return new Date(this.data.updated);
    }

    /**
     * If the data is archived
     *
     * @readonly
     * @type {TS_TypeActual<(T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["archived"] extends "integer" ? "number" : (T & GlobalCols & { vhId: "text"; vhCreated: "text"; })["archived"] extends "bigint" ? "number" : (T & ... 1 more ... & { ...; })["archived"] extends "text" ? "string" : (T & ... 1 more ... & { ...; })["a...}
     */
    get archived() {
        return this.data.archived;
    }

    /**
     * Database instance
     *
     * @readonly
     * @type {Database}
     */
    get database() {
        return this.struct.data.database;
    }

    /**
     * Deletes the version
     *
     * @returns {*}
     */
    delete() {
        return attemptAsync(async () => {
            const query = Query.build(
                `
                DELETE FROM ${this.struct.data.name}History
                WHERE vhId = :vhId
            `,
                {
                    vhId: this.data.vhId
                }
            );

            (await this.struct.data.database.unsafe.run(query)).unwrap();

            this.struct.emit('delete-version', this);
        });
    }

    /**
     * Restores the data to this version
     *
     * @returns {*}
     */
    restore() {
        return attemptAsync(async () => {
            const current = (await this.struct.fromId(this.data.id)).unwrap();
            if (!current) throw new DataError('Current data not found');

            (await current.update(this.data)).unwrap();

            this.struct.emit('restore-version', this);
        });
    }

    /**
     * Retrieves the data from this version
     *
     * @returns {*}
     */
    getUniverses() {
        return attempt<string[]>(() => {
            let { universes } = this.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!universes) universes = '[]' as any;

            const parsed = JSON.parse(universes);
            if (!Array.isArray(parsed))
                throw new FatalDataError('Universes not an array');
            if (!parsed.every(a => typeof a === 'string'))
                throw new FatalDataError('Universes not all strings');

            return parsed as string[];
        });
    }
}

type StreamEvents<T extends Blank, Name extends string> = {
    data: StructData<T, Name>;
    end: void;
    close: void;
    error: Error;
};

export class StructStream<Structure extends Blank, Name extends string> {
    private readonly emitter = new EventEmitter<
        StreamEvents<Structure, Name>
    >();

    public on = this.emitter.on.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public emit = this.emitter.emit.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);

    private index = 0;

    constructor(public readonly struct: Struct<Structure, Name>) {}

    add(data: StructData<Structure, Name>) {
        // if (this.filter && !this.filter(data)) return;
        this.index++;
        this.emit('data', data);
    }

    end() {
        log('Ending stream');
        this.emit('end', undefined);
        this.emitter.destroyEvents();
    }

    close() {
        log('Closing stream');
        this.emit('close', undefined);
        this.emitter.destroyEvents();
    }

    await() {
        return new Promise((res, rej) => {
            const data: StructData<Structure, Name>[] = [];
            this.on('data', d => data.push(d));
            this.on('end', () => res(data));
            this.on('close', () => res(data));
            this.on('error', e => rej(e));
        });
    }

    pipe(fn: (data: StructData<Structure, Name>, index: number) => void) {
        return attemptAsync(
            async () =>
                new Promise<void>((res, rej) => {
                    const run = async (data: StructData<Structure, Name>) => {
                        // if (this.filter && !(await this.filter(data))) return;
                        fn(data, this.index);
                    };

                    const end = (error?: Error) => {
                        this.off('data', run);
                        if (error) rej(error);
                        else res();
                    };

                    this.on('data', run);

                    this.on('end', () => end);
                    this.on('close', () => end);
                    this.on('error', end);
                })
        );
    }
}

/**
 * The class that the data is instantiated to
 *
 * @export
 * @class StructData
 * @typedef {StructData}
 * @template {Blank} Structure
 * @template {string} Name
 * @implements {DataInterface<Struct<Structure, Name>>}
 */
export class StructData<Structure extends Blank, Name extends string>
    implements DataInterface<Struct<Structure, Name>>
{
    /**
     * Creates an instance of StructData.
     *
     * @constructor
     * @param {Struct<Structure, Name>} struct
     * @param {Readonly<St<Structure & GlobalCols, Name>>} data
     */
    constructor(
        public readonly struct: Struct<Structure, Name>,
        public readonly data: Readonly<St<Structure & GlobalCols, Name>>
    ) {
        if (!this.struct.validate(data))
            throw new DataError(
                `Invalid data recieved for ${this.struct.name}`
            );
    }

    /**
     * Data ID
     *
     * @readonly
     * @type {*}
     */
    get id() {
        return this.data.id;
    }

    /**
     * The date the data was created
     *
     * @readonly
     * @type {*}
     */
    get created() {
        return new Date(this.data.created);
    }

    /**
     * The date the data was last updated
     *
     * @readonly
     * @type {*}
     */
    get updated() {
        return new Date(this.data.updated);
    }

    /**
     * If the data is archived
     *
     * @readonly
     * @type {*}
     */
    get archived() {
        return this.data.archived;
    }

    /**
     * Database instance
     *
     * @readonly
     * @type {Database}
     */
    get database() {
        return this.struct.data.database;
    }

    get lifetime() {
        return Number(this.data.lifetime);
    }

    /**
     * Updates the data in the database
     *
     * @param {Partial<St<Structure, Name>>} data
     * @returns {*}
     */
    update(data: Partial<St<Structure, Name>>) {
        return attemptAsync(async () => {
            delete data.updated;
            await this.createVersion();

            if (!this.struct.validate(data))
                throw new DataError(
                    `Invalid data recieved for ${this.struct.name}`
                );

            const validators = this.struct.runValidators(data).unwrap();
            if (!validators.valid) {
                throw new DataError(
                    `Data failed vaildation: ${validators.invalids.join(', ')}, `
                );
            }

            const old = this.data;
            const updated = new Date().toISOString();
            const sql = `
                UPDATE ${this.struct.data.name}
                SET ${Object.keys(data)
                    .map(k => `${k} = :${k}`)
                    .join(', ')},
                    updated = :updated
                WHERE id = :id;
            `;

            const res = await this.struct.data.database.unsafe.run(
                Query.build(sql, {
                    ...old,
                    ...data,
                    updated
                } as Parameter)
            );
            if (res.isErr()) {
                // reset data if update fails
                (
                    await this.struct.data.database.unsafe.run(
                        Query.build(
                            `
                    UPDATE ${this.struct.data.name}
                    SET ${Object.keys(old)
                        .map(k => `${k} = :${k}`)
                        .join(', ')},
                        updated = :updated
                    WHERE id = :id;
                `,
                            old
                        )
                    )
                ).unwrap();
            } else {
                this.struct.emit('update', [old, this]);

                Object.assign(this.data, {
                    ...data,
                    updated
                });
            }
        });
    }

    /**
     * Deletes the data from the database
     *
     * @returns {*}
     */
    delete() {
        return attemptAsync(async () => {
            const query = Query.build(
                `
                DELETE FROM ${this.struct.data.name}
                WHERE id = :id
            `,
                {
                    id: this.data.id
                }
            );

            this.struct.emit('delete', this);

            (await this.struct.data.database.unsafe.run(query)).unwrap();
        });
    }

    /**
     * Sets the data to be archived or restored
     *
     * @param {boolean} archive
     * @returns {*}
     */
    setArchive(archive: boolean) {
        return attemptAsync(async () => {
            const query = Query.build(
                `
                UPDATE ${this.struct.data.name}
                SET archived = :archive
                WHERE id = :id
            `,
                {
                    id: this.data.id,
                    archive
                }
            );

            (await this.struct.data.database.unsafe.run(query)).unwrap();

            this.struct.emit(archive ? 'archive' : 'restore', this);

            Object.assign(this.data, {
                archived: archive
            });
        });
    }

    /**
     * Retrieves the version history of the data
     *
     * @returns {*}
     */
    getVersionHistory() {
        return attemptAsync(async () => {
            if (!this.struct.data.versionHistory) return 'not-enabled';

            const { type, amount } = this.struct.data.versionHistory;

            const query = Query.build(
                `
                SELECT * FROM ${this.struct.data.name}History
                WHERE id = :id
            `,
                {
                    id: this.data.id
                }
            );

            let versions = (
                await this.struct.data.database.unsafe.all<St<Structure, Name>>(
                    query
                )
            )
                .unwrap()
                .map(d => new DataVersion(this.struct, d));
            // sort by date created (oldest first)
            versions.sort(
                (a, b) => a.vhCreated.getTime() - b.vhCreated.getTime()
            );

            versions = versions.filter(v =>
                this.struct.validate(v.data).unwrap()
            );

            if (type === 'versions') {
                const toRemove = versions.splice(0, versions.length - amount);
                await Promise.all(toRemove.map(v => v.delete()));
                return versions;
            }

            // type === 'days';
            const toRemove = versions.filter(
                v =>
                    v.vhCreated.getTime() <
                    new Date().getTime() - amount * 24 * 60 * 60 * 1000
            );
            await Promise.all(toRemove.map(v => v.delete()));
            return versions.filter(
                v =>
                    v.vhCreated.getTime() >=
                    new Date().getTime() - amount * 24 * 60 * 60 * 1000
            );
        });
    }

    /**
     * Creates a new version of the data
     *
     * @returns {*}
     */
    createVersion() {
        return attemptAsync(async () => {
            if (!this.struct.data.versionHistory) {
                throw new DataError('Version history not enabled');
            }

            const vhId = uuid();
            const query = Query.build(
                `
                INSERT INTO ${this.struct.data.name}History (
                    ${Object.keys(this.data).join(', ')},
                    vhId,
                    vhCreated
                )
                VALUES (${Object.keys(this.data)
                    .map(k => `:${k}`)
                    .join(', ')})
            `,
                {
                    ...this.data,
                    vhId,
                    vhCreated: new Date().toISOString()
                } as Parameter
            );

            (await this.struct.data.database.unsafe.run(query)).unwrap();

            const v = new DataVersion(this.struct, {
                ...this.data,
                vhId
            });

            this.struct.emit('version', v);

            return v;
        });
    }

    /**
     * Gets the attributes of the data
     *
     * @returns {*}
     */
    getAttributes() {
        return attempt<string[]>(() => {
            const { attributes } = this.data;
            if (!attributes) throw new FatalDataError('No attributes found');

            const parsed = JSON.parse(attributes);
            if (!Array.isArray(parsed))
                throw new FatalDataError('Attributes not an array');
            if (!parsed.every(a => typeof a === 'string'))
                throw new FatalDataError('Attributes not all strings');

            return parsed as string[];
        });
    }

    /**
     * Creates new attributes for the data
     *
     * @param {...string[]} attrs
     * @returns {*}
     */
    addAttributes(...attrs: string[]) {
        return attemptAsync(async () => {
            const attributes = this.getAttributes().unwrap();
            const combined = [...attributes, ...attrs].filter(
                (a, i, arr) => arr.indexOf(a) === i
            );

            (await this.setAttributes(combined)).unwrap();
        });
    }

    /**
     * Removes an attribute from the data
     *
     * @param {string} attr
     * @returns {*}
     */
    removeAttribute(attr: string) {
        return attemptAsync(async () => {
            const attributes = this.getAttributes().unwrap();

            if (!attributes.includes(attr)) return;

            const index = attributes.indexOf(attr);

            attributes.splice(index, 1);

            (await this.setAttributes(attributes)).unwrap();
        });
    }

    /**
     * Sets the attributes of the data (overwrites)
     *
     * @param {string[]} attrs
     * @returns {*}
     */
    setAttributes(attrs: string[]) {
        return attemptAsync(async () => {
            const old = JSON.parse(JSON.stringify(this.data)) as St<
                Structure & GlobalCols,
                Name
            >;
            Object.assign(this.data, {
                attributes: JSON.stringify(attrs)
            });

            const query = Query.build(
                `
                UPDATE ${this.struct.data.name}
                SET attributes = :attributes
                WHERE id = :id
            `,
                {
                    id: this.data.id,
                    attributes: JSON.stringify(attrs)
                }
            );

            (await this.struct.data.database.unsafe.run(query)).unwrap();

            this.struct.emit('update', [old, this]);
        });
    }

    /**
     * Retrieves the universes the data is in
     *
     * @returns {*}
     */
    getUniverses() {
        return attempt<string[]>(() => {
            let { universes } = this.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!universes) universes = '[]' as any;

            const parsed = JSON.parse(universes);
            if (!Array.isArray(parsed))
                throw new FatalDataError('Universes not an array');
            if (!parsed.every(a => typeof a === 'string'))
                throw new FatalDataError('Universes not all strings');

            return parsed as string[];
        });
    }

    /**
     * Sets the universes the data is in (overwrites)
     *
     * @param {string[]} universes
     * @returns {*}
     */
    setUniverses(universes: string[]) {
        return attemptAsync(async () => {
            let limit = this.struct.data.universeLimit;
            if (!limit) limit = 1;
            if (universes.length > limit) {
                throw new DataError(
                    `${this.struct.name} data cannot be in more than ${limit} universe(s)`
                );
            }
            const str = JSON.stringify(universes);

            const query = Query.build(
                `
                UPDATE ${this.struct.data.name}
                SET universes = :universes
                WHERE id = :id
            `,
                {
                    id: this.data.id,
                    universes: str
                }
            );

            (await this.struct.data.database.unsafe.run(query)).unwrap();

            Object.assign(this.data, {
                universes: str
            });
        });
    }

    addUniverses(...universe: string[]) {
        return attemptAsync(async () => {
            const current = this.getUniverses().unwrap();
            const combined = [...current, ...universe].filter(
                (a, i, arr) => arr.indexOf(a) === i
            );

            return (await this.setUniverses(combined)).unwrap();
        });
    }

    removeUniverses(...universe: string[]) {
        return attemptAsync(async () => {
            const current = this.getUniverses().unwrap();
            const combined = current.filter(u => !universe.includes(u));

            return (await this.setUniverses(combined)).unwrap();
        });
    }
}

/**
 * Used to type the data that is returned from a struct
 *
 * @export
 * @typedef {Data}
 * @template {Struct<Blank, string>} SubStruct
 */
export type Data<SubStruct extends Struct<Blank, string>> = StructData<
    SubStruct['data']['structure'],
    SubStruct['data']['name']
>;

/**
 * Struct class
 * Used to define the structure of data
 *
 * @export
 * @class Struct
 * @typedef {Struct}
 * @template {Blank} Structure
 * @template {string} Name
 */
export class Struct<Structure extends Blank, Name extends string> {
    private static initImage(struct: Struct<Blank, string>, image: string) {
        return attemptAsync(async () => {
            // TODO: Type checking for image
            const { name, defaults, structure, versionHistory } = JSON.parse(
                decode(image)
            ) as StructImage<(typeof struct)['data']['structure']>;

            const { database } = struct.data;

            const current = (
                await database.unsafe.get<{
                    schema: string;
                    name: string;
                }>(
                    Query.build('SELECT * FROM Structs WHERE name = :name;', {
                        name: name
                    })
                )
            ).unwrap();

            // log('Has current', current);

            if (current) {
                const cols = Object.keys(structure).map(k => k.toLowerCase());
                const currentCols = Object.keys(JSON.parse(current.schema)).map(
                    k => k.toLowerCase()
                );

                const throwErr = () => {
                    // TODO: Prompt through CLI to delete all data and reset the change
                    // "THis will affect (x) columns"
                    throw new StructError(
                        `Struct ${name} already exists with different columns. Please remove ${cols.filter(c => !currentCols.includes(c)).join(', ')}`
                    );
                };

                if (!cols.every(c => currentCols.includes(c))) {
                    throwErr();
                }

                if (!currentCols.every(c => cols.includes(c))) {
                    throwErr();
                }

                if (
                    currentCols.some(
                        c =>
                            cols[c as keyof typeof cols] !==
                            currentCols[c as keyof typeof currentCols]
                    )
                ) {
                    throwErr();
                }
            } else {
                (
                    await database.unsafe.run(
                        Query.build(
                            `
                    INSERT INTO Structs (name, schema)
                    VALUES (:name, :schema);
                `,
                            {
                                name: name,
                                schema: JSON.stringify(structure)
                            }
                        )
                    )
                ).unwrap();
            }

            // log('Creating new table');

            const query = Query.build(
                `
                    CREATE TABLE IF NOT EXISTS ${name} (
                        id text PRIMARY KEY,
                        created text NOT NULL,
                        updated text NOT NULL,
                        archived boolean NOT NULL,
                        attributes text NOT NULL,
                        universes text NOT NULL,
                        lifetime int NOT NULL,
                        ${Object.entries(structure)
                            .map(([key, value]) => {
                                return `${key} ${value}`;
                            })
                            .join(', ')}
                    );
                `
            );

            // log('Query', query);

            (await database.unsafe.run(query)).unwrap();

            if (versionHistory) {
                const query = Query.build(`
                    CREATE TABLE IF NOT EXISTS ${name}History (
                        vhId text PRIMARY KEY,
                        vhCreated text NOT NULL,
                        id text,
                        created text NOT NULL,
                        updated text NOT NULL,
                        archived boolean NOT NULL,
                        attributes text NOT NULL,
                        universes text NOT NULL,
                        lifetime int NOT NULL,
                        ${Object.entries(structure)
                            .map(([key, value]) => {
                                return `${key} ${value}`;
                            })
                            .join(', ')}
                    );
                `);

                (await database.unsafe.run(query)).unwrap();
            }

            if (defaults) {
                // doesn't matter if this throws an error. It most likely is due duplicate data, which is fine since it's the default values.
                // TODO: should we await this? It could be better to just let it run in the background
                await Promise.all(
                    defaults.map(async d => {
                        const res = await struct.new(d);
                        if (res.isErr()) {
                            const current = await struct.fromId(d.id);
                            if (current.isOk()) {
                                // update if there is a conflict. This is useful if there are changes to the default data
                                await current.value?.update(d);
                            }
                        }
                    })
                );
            }
        });
    }

    public static generateLifetimeLoop(time: number) {
        return new Loop(async () => {
            Struct.forEach(s => {
                s.getLifetimeItems(true).pipe(async d => {
                    if (d.lifetime === 0) return;
                    if (d.created.getTime() + d.lifetime < Date.now()) {
                        (await d.delete()).unwrap();
                    }
                });
            });
        }, time);
    }

    public static forEach(
        fn: (struct: Struct<Blank, string>) => void | Promise<void>
    ) {
        return Array.from(Struct.structs).map(([_, s]) => fn(s));
    }

    /**
     * All the structs in the program
     *
     * @private
     * @static
     * @type {*}
     */
    private static structs = new Map<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Struct<any, string>
    >();

    /**
     * The global router used for all structs
     *
     * @public
     * @static
     * @readonly
     * @type {*}
     */
    public static readonly router = new Route();

    /**
     * Builds all the structs
     *
     * @public
     * @static
     * @returns {*}
     */
    public static buildAll(doLoop: boolean) {
        return attemptAsync(async () => {
            Struct.router.post('/*', (req, _, next) => {
                log('Struct', req.pathname);

                next();
            });

            await Promise.all(
                Struct.forEach(async s => {
                    (await s.build()).unwrap();

                    // Struct.router.route(
                    //     '/' + s.name,
                    //     s.route
                    // );
                })
            );

            if (doLoop) {
                Struct.generateLifetimeLoop(1000 * 60 * 60).start();
            }
        });
    }

    /**
     * Route for the struct
     *
     * @private
     * @readonly
     * @type {*}
     */
    // private readonly route = new Route();

    /**
     * Default data for the struct (applied when building)
     *
     * @private
     * @readonly
     * @type {Structable<Struct<Structure, Name>>[]}
     */
    private readonly defaults: Structable<Struct<Structure, Name>>[] = [];

    /**
     * If the struct has been built
     *
     * @private
     * @type {boolean}
     */
    private built = false;

    // private readonly permissions: {
    //     [key: string]: (target: string, data: Data<typeof this>) => boolean;
    // } = {};

    /**
     * Used to instantiate the data
     *
     * @public
     * @param {St<Structure & GlobalCols, Name>} data
     * @returns {StructData<Structure, Name>}
     */
    public Generator(data: St<Structure & GlobalCols, Name>) {
        return new StructData<Structure, Name>(this, data);
    }

    /**
     * The columns of the struct
     *
     * @public
     * @readonly
     * @type {Readonly<ColMap<Structure, Name>>}
     */
    public readonly cols: Readonly<ColMap<Structure, Name>>;

    /**
     * Event emitter for the struct
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly emitter = new EventEmitter<{
        // [from, to]
        update: [
            Structable<Struct<Structure, Name>>,
            StructData<Structure, Name>
        ];
        delete: Data<Struct<Structure, Name>>;
        archive: Data<Struct<Structure, Name>>;
        restore: Data<Struct<Structure, Name>>;
        create: Data<Struct<Structure, Name>>;
        version: DataVersion<Structure, Name>;
        'restore-version': DataVersion<Structure, Name>;
        'delete-version': DataVersion<Structure, Name>;
        // read: Data<Struct<Structure, Name>>;
        build: void;
    }>();

    /**
     * Listens for events
     *
     * @public
     * @type {*}
     */
    public on = this.emitter.on.bind(this.emitter);
    /**
     * Removes event listeners
     *
     * @public
     * @type {*}
     */
    public off = this.emitter.off.bind(this.emitter);
    /**
     * Emits an event
     *
     * @public
     * @type {*}
     */
    public emit = this.emitter.emit.bind(this.emitter);

    public loop?: Loop;
    /**
     * Creates an instance of Struct.
     *
     * @constructor
     * @param {StructBuilder<Structure, Name>} data
     */
    constructor(public readonly data: StructBuilder<Structure, Name>) {
        if (!data.sample) {
            if (Struct.structs.has(this.data.name)) {
                throw new FatalStructError(
                    `Struct ${this.data.name} already exists in the program or you have a duplicate struct name`
                );
            }
            Struct.structs.set(this.data.name, this);
        }

        if (data.loop) {
            const { fn, time } = data.loop;
            this.loop = new Loop(() => fn(this), time);
            this.loop.start();
        }

        const cols = Object.keys(data.structure).map(k => k.toLowerCase());
        if (
            ['id', 'created', 'updated', 'archived'].some(k => cols.includes(k))
        ) {
            throw new FatalStructError(
                `${this.data.name} Struct cannot use id, created, updated, or archived as column names as they are reserved. Please remove ${cols.filter(k => ['id', 'created', 'updated', 'archived'].includes(k)).join(', ')}`
            );
        }

        this.cols = Object.entries(data.structure).reduce(
            (acc, [key, value]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (acc as any)[key] = new Column(key, value, this);
                return acc;
            },
            {} as ColMap<Structure, Name>
        );

        // this.listen<{
        //     id: 'string';
        // }>('/*', validate({
        //     id: 'string',
        // }), async (req, res, next) => {
        //     const functions = this.permissionFunctions.get(req.pathname.replace('/', ''));
        //     if (!functions) return res.sendStatus(new Status(
        //         {
        //             code: 404,
        //             message: 'Not Found',
        //             color: 'danger',
        //             instructions: ''
        //         },
        //         this.data.name,
        //         'Not Found',
        //         '{}',
        //         req
        //     ));

        //     next();
        // });
    }

    /**
     * Struct name
     *
     * @readonly
     * @type {Name}
     */
    get name() {
        return this.data.name;
    }

    /**
     * Database instance
     *
     * @readonly
     * @type {Database}
     */
    get database() {
        return this.data.database;
    }

    /**
     * Creates a sample type of the struct.
     * This should only be used for testing the typesystem, and not be actually run.
     * If this is run at all, it will throw an error.
     *
     * @readonly
     * @type {StructData<Structure, Name>}
     */
    get sample(): StructData<Structure, Name> {
        throw new FatalStructError(
            `${this.name}.sample should never be run. It is only used for testing the typesystem. Remove this in order for the program to run.`
        );
    }

    /**
     * Builds the struct
     * This will:
     *      - Create the table in the database
     *      - Create the version history table if versionHistory is enabled
     *      - Insert the default data if it exists
     *      - Check if the struct already exists and has the same columns
     *      - If the struct already exists with different columns, it will throw an error
     *      - If the struct already exists with the same columns, it will do nothing
     *      - Creates the front end routes
     * If the struct has already been built or is a sample, it will throw an error
     *
     * @returns {*}
     */
    build() {
        if (this.built)
            throw new FatalStructError(
                `Struct ${this.data.name} already built`
            );
        if (this.data.sample)
            throw new FatalStructError(
                `Sample struct: ${this.data.name}. Not built`
            );
        return attemptAsync(async () => {
            const { Permissions } = await import('./permissions');
            const { Session } = await import('./session');
            const { Account } = await import('./account');
            const { API } = await import('./api');

            const image = (await this.imagize()).unwrap();
            (await Struct.initImage(this, image)).unwrap();

            const notSignedInStatus = (req: Req) =>
                new Status(
                    {
                        code: 401,
                        message: 'Not Signed In',
                        color: 'danger',
                        instructions: ''
                    },
                    this.data.name,
                    'Not Signed In',
                    '{}',
                    req
                );

            const notPermittedStatus = (req: Req, action: string) =>
                new Status(
                    {
                        code: 403,
                        message: `You are not permitted to perform action: ${capitalize(action)} on ${capitalize(this.data.name)}`,
                        color: 'danger',
                        instructions: ''
                    },
                    this.data.name,
                    'Not Permitted',
                    '{}',
                    req
                );

            const notFoundStatus = (req: Req) =>
                new Status(
                    {
                        code: 404,
                        message: `${this.data.name} not found`,
                        color: 'danger',
                        instructions: ''
                    },
                    this.data.name,
                    'Not Found',
                    '{}',
                    req
                );

            const noVersionHistoryStatus = (req: Req) =>
                new Status(
                    {
                        code: 404,
                        message: `No version history found for ${this.data.name}`,
                        color: 'danger',
                        instructions: ''
                    },
                    this.data.name,
                    'Not Found',
                    '{}',
                    req
                );

            const versionHistoryNotEnabledStatus = (req: Req) =>
                new Status(
                    {
                        code: 404,
                        message: `Version history not enabled for ${this.data.name}`,
                        color: 'danger',
                        instructions: ''
                    },
                    this.data.name,
                    'Not Found',
                    '{}',
                    req
                );

            // if it's undefined, or true, this should run
            if (this.data.frontend !== false) {
                this.listen<{
                    name: string;
                    structure: Record<string, string>;
                }>(
                    '/connect',
                    // (req, res, next) => {
                    //     log('Connect:', req.body);
                    //     next();
                    // },
                    validate({
                        structure: (s: unknown) => {
                            if (typeof s !== 'object' || !s) return true;
                            if (Array.isArray(s)) return true;
                            if (Object.keys(s).length === 0) return true;
                            if (
                                !Object.values(s).every(
                                    v =>
                                        typeof v === 'string' &&
                                        [
                                            'integer',
                                            'bigint',
                                            'text',
                                            'json',
                                            'boolean',
                                            'real',
                                            'numeric'
                                        ].includes(v)
                                )
                            )
                                return true;
                            return true;
                        }
                    }),
                    (req, res) => {
                        // ensure the structures are the same

                        const { structure } = req.body;

                        // showcase that the two objects are the same, even if the keys are out of order
                        const keys = Object.keys(structure).sort();
                        const keys2 = Object.keys(this.data.structure).sort();

                        if (keys.join(',') !== keys2.join(',')) {
                            return res.sendStatus(
                                new Status(
                                    {
                                        code: 400,
                                        message: 'Structures do not match',
                                        color: 'danger',
                                        instructions: ''
                                    },
                                    this.data.name,
                                    'Structures Do Not Match',
                                    '{}',
                                    req
                                )
                            );
                        }

                        const values = Object.values(structure).sort();
                        const values2 = Object.values(
                            this.data.structure
                        ).sort();

                        if (values.join(',') !== values2.join(',')) {
                            return res.sendStatus(
                                new Status(
                                    {
                                        code: 400,
                                        message: 'Structures do not match',
                                        color: 'danger',
                                        instructions: ''
                                    },
                                    this.data.name,
                                    'Structures Do Not Match',
                                    '{}',
                                    req
                                )
                            );
                        }

                        // res.sendStatus(
                        //     new Status(
                        //         {
                        //             code: 200,
                        //             message: 'Structures match',
                        //             color: 'success',
                        //             instructions: ''
                        //         },
                        //         this.data.name,
                        //         'Structures Match',
                        //         '{}',
                        //         req
                        //     )
                        // );
                        res.status(200).json({
                            struct: this.name,
                            match: true
                        });
                    }
                );

                this.listen<St<Structure & GlobalCols, Name>>(
                    '/create',
                    this.validator(false),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const roles = await (
                            await Permissions.getRoles(account)
                        ).unwrap();

                        const validators = this.runValidators(
                            req.body
                        ).unwrap();
                        if (validators.invalids.length) {
                            return res.sendStatus(
                                new Status(
                                    {
                                        code: 400,
                                        message: `Data failed validation: ${validators.invalids.join(', ')}`,
                                        color: 'danger',
                                        instructions:
                                            'Please check the data and try again'
                                    },
                                    this.data.name,
                                    'Validation Failed',
                                    '{}',
                                    req
                                )
                            );
                        }

                        if (
                            !(await Account.isAdmin(account)).unwrap() ||
                            !(
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            if (
                                !this.bypasses
                                    .filter(
                                        b =>
                                            b.permission ===
                                                DataAction.Create ||
                                            b.permission === '*'
                                    )
                                    .some(bp => bp.fn(account))
                            ) {
                                if (
                                    !Permissions.canDo(
                                        roles,
                                        this,
                                        DataAction.Create
                                    ).unwrap()
                                ) {
                                    return res.sendStatus(
                                        notPermittedStatus(req, 'create')
                                    );
                                }
                            }
                        }

                        const n = (await this.new(req.body)).unwrap();

                        (
                            await n.setUniverses(
                                (await req.getSession())
                                    .unwrap()
                                    .getUniverses()
                                    .unwrap() || []
                            )
                        ).unwrap();

                        res.sendStatus(
                            new Status(
                                {
                                    code: 201,
                                    message: `${this.data.name} created successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Created',
                                '{}',
                                req
                            )
                        );

                        req.io
                            // .to(n.getUniverses().unwrap())
                            // to(req.universe || '')
                            .emit(`struct:${this.data.name}:create`, n.data);

                        // (await Logs.Log.new({
                        //     account: account.id,
                        //     action: DataAction.Create,
                        //     struct: this.name,
                        //     properties: n.id,
                        // })).unwrap();
                    }
                );

                this.listen<St<Structure & GlobalCols, Name>>(
                    '/update',
                    this.validator(true),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        const roles = (
                            await Permissions.getRoles(account)
                        ).unwrap();

                        if (!n) return res.sendStatus(notFoundStatus(req));

                        const validators = this.runValidators(
                            req.body
                        ).unwrap();
                        if (validators.invalids.length) {
                            return res.sendStatus(
                                new Status(
                                    {
                                        code: 400,
                                        message: `Data failed validation: ${validators.invalids.join(', ')}`,
                                        color: 'danger',
                                        instructions:
                                            'Please check the data and try again'
                                    },
                                    this.data.name,
                                    'Validation Failed',
                                    '{}',
                                    req
                                )
                            );
                        }

                        const bypasses = this.bypasses.filter(
                            b =>
                                b.permission === PropertyAction.Update ||
                                b.permission === '*'
                        );

                        let doBypass = false;
                        if (bypasses) {
                            doBypass = bypasses.some(bp => bp.fn(account, n));
                        }
                        if (
                            (await Account.isAdmin(account)).unwrap() ||
                            (
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            doBypass = true;
                        }

                        if (doBypass) {
                            (await n.update(req.body)).unwrap();
                            req.io
                                // to(req.universe || '')
                                // .to(roles.map(r => r.id))
                                .emit(
                                    `struct:${this.data.name}:update`,
                                    req.body
                                );
                        } else {
                            const [updatable] = (
                                await Permissions.filterAction(
                                    roles,
                                    [n],
                                    PropertyAction.Update
                                )
                            ).unwrap();

                            const updated = Object.fromEntries(
                                Object.entries(updatable).map(([k, v]) => [
                                    k,
                                    req.body[k] || v
                                ])
                            ) as St<Structure, Name>;

                            // only update the fields that are updatable
                            (await n.update(updated)).unwrap();

                            req.io
                                // to(req.universe || '')
                                // .to(n.getUniverses().unwrap())
                                .emit(
                                    `struct:${this.data.name}:update`,
                                    updated
                                );
                        }
                        res.sendStatus(
                            new Status(
                                {
                                    code: 200,
                                    message: `${this.data.name} updated successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Updated',
                                '{}',
                                req
                            )
                        );

                        // (await Logs.Log.new({
                        //     account: account.id,
                        //     action: PropertyAction.Update,
                        //     struct: this.name,
                        //     properties: JSON.stringify({
                        //         id: n.id,
                        //         updated,
                        //     }),
                        // })).unwrap();
                    }
                );

                this.listen<{
                    id: string;
                }>(
                    '/read.from-id',
                    validate({
                        id: 'string'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        if (
                            (await Account.isAdmin(account)).unwrap() ||
                            (
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            return res.json(n.data);
                        }

                        const roles = (
                            await Permissions.getRoles(account)
                        ).unwrap();

                        if (
                            this.bypasses
                                .filter(
                                    b =>
                                        b.permission === PropertyAction.Read ||
                                        b.permission === '*'
                                )
                                .some(bp => bp.fn(account, n))
                        ) {
                            res.json(n.data);
                        } else {
                            const [readable] = (
                                await Permissions.filterAction(
                                    roles,
                                    [n],
                                    PropertyAction.Read
                                )
                            ).unwrap();
                            if (!readable)
                                return res.sendStatus(
                                    notPermittedStatus(req, 'read')
                                );

                            res.json(readable);
                        }
                    }
                );

                this.listen('/read.all', async (req, res) => {
                    const account = (
                        await Session.getAccount(req.sessionId)
                    ).unwrap();
                    if (!account) return res.sendStatus(notSignedInStatus(req));

                    if (
                        (await Account.isAdmin(account)).unwrap() ||
                        (
                            await API.canAccess(
                                req.headers.get('x-api-key') || '',
                                this
                            )
                        ).unwrap()
                    ) {
                        return res.stream<StructData<Structure, Name>>(
                            this.all(true, false),
                            data => data.data
                        );
                    }

                    const roles = (
                        await Permissions.getRoles(account)
                    ).unwrap();

                    // const n = (await this.all(false)).unwrap();

                    const bypasses = this.bypasses.filter(
                        b =>
                            b.permission === PropertyAction.Read ||
                            b.permission === '*'
                    );

                    // res.json(
                    //     [
                    //         ...n
                    //             .filter(d =>
                    //                 bypasses.some(bp => bp.fn(account, d))
                    //             )
                    //             .map(d => d.data),
                    //         ...(
                    //             await Permissions.filterAction(
                    //                 roles,
                    //                 n.filter(d => !d.archived),
                    //                 PropertyAction.Read
                    //             )
                    //         )
                    //             .unwrap()
                    //     ].filter(
                    //         (v, i, a) =>
                    //             a.findIndex(
                    //             // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    //                 t => (t as any).id === (v as any).id
                    //             ) === i
                    //     )
                    // );

                    const stream = this.all(true);
                    // stream.pipe(async data => {
                    //     if (bypasses.some(bp => bp.fn(account, data))) {
                    //         return res.write(JSON.stringify(data.data));
                    //     }

                    //     const [d] = (
                    //         await Permissions.filterAction(
                    //             roles,
                    //             [data],
                    //             PropertyAction.Read
                    //         )
                    //     ).unwrap();
                    //     if (!d) return;
                    //     res.write(JSON.stringify(d));
                    // });

                    // stream.on('end', () => res.end());
                    // stream.on('close', () => res.end());
                    // stream.on('error', () => res.end());

                    res.stream<StructData<Structure, Name>>(
                        stream,
                        async data => {
                            if (bypasses.some(bp => bp.fn(account, data))) {
                                return data.data;
                            }

                            const [d] = (
                                await Permissions.filterAction(
                                    roles,
                                    [data],
                                    PropertyAction.Read
                                )
                            ).unwrap();
                            return d;
                        }
                    );
                });

                this.listen<{
                    property: unknown;
                    value: unknown;
                }>(
                    '/read.from-property',
                    validate({
                        property: v => {
                            log('Checking property', v);
                            return Object.keys(this.data.structure).includes(v);
                        },
                        value: (v, self) => {
                            log('Checking self.value', self);
                            return typeValidation(
                                this.data.structure[
                                    self?.property as keyof Structure
                                ],
                                v
                            );
                        }
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        if (
                            (await Account.isAdmin(account)).unwrap() ||
                            (
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            return res.stream<StructData<Structure, Name>>(
                                this.fromProperty(
                                    req.body.property as keyof Structure,
                                    req.body.value,
                                    true
                                ),
                                async data => data.data
                            );
                        }

                        const roles = (
                            await Permissions.getRoles(account)
                        ).unwrap();

                        // const n = (await this.fromProperty(req.body.property as keyof Structure, req.body.value)).unwrap();

                        const bypasses = this.bypasses.filter(
                            b =>
                                b.permission === PropertyAction.Read ||
                                b.permission === '*'
                        );

                        // res.json(
                        //     [
                        //         ...n
                        //             .filter(d =>
                        //                 bypasses.some(bp => bp.fn(account, d))
                        //             )
                        //             .map(d => d.data),
                        //         ...(
                        //             await Permissions.filterAction(
                        //                 roles,
                        //                 n.filter(d => !d.archived),
                        //                 PropertyAction.Read
                        //             )
                        //         )
                        //             .unwrap()
                        //     ].filter(
                        //         (v, i, a) =>
                        //             a.findIndex(
                        //             // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        //                 t => (t as any).id === (v as any).id
                        //             ) === i
                        //     )
                        // );

                        // EXPERIMENTAL:
                        const stream = this.fromProperty(
                            req.body.property as keyof Structure,
                            req.body.value,
                            true
                        );
                        // stream.pipe(async data => {
                        //     if (bypasses.some(bp => bp.fn(account, data))) {
                        //         return res.write(JSON.stringify(data.data));
                        //     }

                        //     const [d] = (
                        //         await Permissions.filterAction(
                        //             roles,
                        //             [data],
                        //             PropertyAction.Read
                        //         )
                        //     ).unwrap();
                        //     if (!d) return;
                        //     res.write(JSON.stringify(d));
                        // });

                        // stream.on('end', () => res.end());
                        // stream.on('close', () => res.end());
                        // stream.on('error', () => res.end());

                        res.stream<StructData<Structure, Name>>(
                            stream,
                            async data => {
                                if (bypasses.some(bp => bp.fn(account, data))) {
                                    return data.data;
                                }

                                const [d] = (
                                    await Permissions.filterAction(
                                        roles,
                                        [data],
                                        PropertyAction.Read
                                    )
                                ).unwrap();
                                return d;
                            }
                        );
                    }
                );

                this.listen('/read.archived', async (req, res) => {
                    const account = (
                        await Session.getAccount(req.sessionId)
                    ).unwrap();
                    if (!account) return res.sendStatus(notSignedInStatus(req));

                    if (
                        (await Account.isAdmin(account)).unwrap() ||
                        (
                            await API.canAccess(
                                req.headers.get('x-api-key') || '',
                                this
                            )
                        ).unwrap()
                    ) {
                        return res.stream<StructData<Structure, Name>>(
                            this.archived(true),
                            async data => data.data
                        );
                    }

                    const roles = (
                        await Permissions.getRoles(account)
                    ).unwrap();

                    // const n = (await this.archived(false)).unwrap();

                    const bypasses = this.bypasses.filter(
                        b =>
                            b.permission === DataAction.ReadArchive ||
                            b.permission === '*'
                    );

                    // res.json(
                    //     [
                    //         ...n.filter(d =>
                    //             bypasses.some(bp => bp.fn(account, d))
                    //         )
                    //         .map(d => d.data)
                    //         ,
                    //         ...(
                    //             await Permissions.filterAction(
                    //                 roles,
                    //                 n,
                    //                 PropertyAction.ReadArchive
                    //             )
                    //         )
                    //             .unwrap()
                    //     ].filter(
                    //         (v, i, a) =>
                    //             a.findIndex(
                    //             // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    //                 t => (t as any).id === (v as any).id
                    //             ) === i
                    //     )
                    // );

                    const stream = this.archived(true);
                    // stream.pipe(async data => {
                    //     if (bypasses.some(bp => bp.fn(account, data))) {
                    //         return res.write(JSON.stringify(data.data));
                    //     }

                    //     const [d] = (
                    //         await Permissions.filterAction(
                    //             roles,
                    //             [data],
                    //             PropertyAction.ReadArchive
                    //         )
                    //     ).unwrap();
                    //     if (!d) return;
                    //     res.write(JSON.stringify(d));
                    // });

                    // stream.on('end', () => res.end());
                    // stream.on('close', () => res.end());
                    // stream.on('error', () => res.end());

                    res.stream<StructData<Structure, Name>>(
                        stream,
                        async data => {
                            if (bypasses.some(bp => bp.fn(account, data))) {
                                return data.data;
                            }

                            const [d] = (
                                await Permissions.filterAction(
                                    roles,
                                    [data],
                                    PropertyAction.Read
                                )
                            ).unwrap();
                            return d;
                            // if (!d) return;
                            // res.write(JSON.stringify(d));
                            // return d;
                        }
                    );
                });

                this.listen<{
                    id: string;
                }>(
                    '/read.version-history',
                    validate({
                        id: 'string'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        if (
                            (await Account.isAdmin(account)).unwrap() ||
                            (
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            const n = (await this.fromId(req.body.id)).unwrap();
                            if (!n) return res.sendStatus(notFoundStatus(req));

                            const versions = (
                                await n.getVersionHistory()
                            ).unwrap();

                            if (versions === 'not-enabled') {
                                return res.sendStatus(
                                    versionHistoryNotEnabledStatus(req)
                                );
                            }

                            return res.json(versions.map(d => d.data));
                        }

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        if (
                            !this.bypasses
                                .filter(
                                    b =>
                                        b.permission ===
                                            DataAction.ReadVersionHistory ||
                                        b.permission === '*'
                                )
                                .some(bp => bp.fn(account, n))
                        ) {
                            const roles = (
                                await Permissions.getRoles(account)
                            ).unwrap();
                            if (
                                !(
                                    await Permissions.filterAction(
                                        roles,
                                        [n],
                                        PropertyAction.Read
                                    )
                                ).unwrap().length
                            ) {
                                return res.sendStatus(
                                    notPermittedStatus(
                                        req,
                                        'read version history'
                                    )
                                );
                            }
                        }

                        const versions = (await n.getVersionHistory()).unwrap();

                        if (versions === 'not-enabled') {
                            return res.sendStatus(
                                versionHistoryNotEnabledStatus(req)
                            );
                        }

                        res.json(versions.map(d => d.data));
                    }
                );

                this.listen<{
                    id: string;
                    vId: string;
                }>(
                    '/version.restore',
                    validate({
                        id: 'string',
                        vId: 'string'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        if (
                            !(await Account.isAdmin(account)).unwrap() ||
                            !(
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            const roles = (
                                await Permissions.getRoles(account)
                            ).unwrap();
                            if (
                                !this.bypasses
                                    .filter(
                                        bp =>
                                            bp.permission ===
                                                DataAction.RestoreVersion ||
                                            bp.permission === '*'
                                    )
                                    .some(bp => bp.fn(account, n))
                            ) {
                                const doable = Permissions.canDo(
                                    roles,
                                    n.struct,
                                    DataAction.RestoreVersion
                                );

                                if (!doable)
                                    return res.sendStatus(
                                        notPermittedStatus(
                                            req,
                                            'version restore'
                                        )
                                    );
                            }
                        }

                        const versions = (await n.getVersionHistory()).unwrap();
                        if (versions === 'not-enabled') {
                            return res.sendStatus(
                                versionHistoryNotEnabledStatus(req)
                            );
                        }

                        const version = versions.find(
                            v => v.vhId === req.body.vId
                        );
                        if (!version)
                            return res.sendStatus(noVersionHistoryStatus(req));

                        (await version.restore()).unwrap();

                        res.sendStatus(
                            new Status(
                                {
                                    code: 200,
                                    message: `${this.data.name} restored successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Restored',
                                '{}',
                                req
                            )
                        );

                        req.io
                            // to(req.universe || '')
                            // .to(n.getUniverses().unwrap())
                            .emit(`struct:${this.data.name}:restore`, n.data);
                    }
                );

                this.listen<{
                    id: string;
                    vhId: string;
                }>(
                    '/version.delete',
                    validate({
                        id: 'string',
                        vhId: 'string'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        const versions = (await n.getVersionHistory()).unwrap();
                        if (versions === 'not-enabled') {
                            return res.sendStatus(
                                versionHistoryNotEnabledStatus(req)
                            );
                        }

                        if (
                            !(await Account.isAdmin(account)).unwrap() ||
                            !(
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            const roles = (
                                await Permissions.getRoles(account)
                            ).unwrap();

                            if (
                                !this.bypasses
                                    .filter(
                                        bp =>
                                            bp.permission ===
                                                DataAction.DeleteVersion ||
                                            bp.permission === '*'
                                    )
                                    .some(bp => bp.fn(account, n))
                            ) {
                                const doable = Permissions.canDo(
                                    roles,
                                    n.struct,
                                    DataAction.DeleteVersion
                                );

                                if (doable)
                                    return res.sendStatus(
                                        notPermittedStatus(
                                            req,
                                            'delete version'
                                        )
                                    );
                            }
                        }

                        const version = versions.find(
                            v => v.vhId === req.body.vhId
                        );
                        if (!version) {
                            return res.sendStatus(noVersionHistoryStatus(req));
                        }

                        (await version.delete()).unwrap();

                        res.sendStatus(
                            new Status(
                                {
                                    code: 200,
                                    message: `${this.data.name} version deleted successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Deleted',
                                '{}',
                                req
                            )
                        );

                        req.io
                            // .to(n.getUniverses().unwrap())
                            // to(req.universe || '')
                            .emit(
                                `struct:${this.data.name}:delete-version`,
                                n.data
                            );
                    }
                );

                this.listen<{
                    id: string;
                }>(
                    '/delete',
                    validate({
                        id: 'string'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        if (
                            !(await Account.isAdmin(account)).unwrap() ||
                            !(
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            const roles = (
                                await Permissions.getRoles(account)
                            ).unwrap();

                            if (
                                !this.bypasses
                                    .filter(
                                        bp =>
                                            bp.permission ===
                                                DataAction.Delete ||
                                            bp.permission === '*'
                                    )
                                    .some(bp => bp.fn(account, n))
                            ) {
                                if (
                                    !Permissions.canDo(
                                        roles,
                                        this,
                                        DataAction.Delete
                                    ).unwrap()
                                )
                                    return res.sendStatus(
                                        notPermittedStatus(req, 'delete')
                                    );
                            }
                        }

                        (await n.delete()).unwrap();

                        res.sendStatus(
                            new Status(
                                {
                                    code: 200,
                                    message: `${this.data.name} deleted successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Deleted',
                                '{}',
                                req
                            )
                        );

                        req.io
                            // .to(n.getUniverses().unwrap())
                            // to(req.universe || '')
                            .emit(`struct:${this.data.name}:delete`, n.data.id);
                    }
                );

                this.listen<{
                    id: string;
                    archive: boolean;
                }>(
                    '/archive.set',
                    validate({
                        id: 'string',
                        archive: 'boolean'
                    }),
                    async (req, res) => {
                        const account = (
                            await Session.getAccount(req.sessionId)
                        ).unwrap();
                        if (!account)
                            return res.sendStatus(notSignedInStatus(req));

                        const n = (await this.fromId(req.body.id)).unwrap();
                        if (!n) return res.sendStatus(notFoundStatus(req));

                        if (
                            !(await Account.isAdmin(account)).unwrap() ||
                            !(
                                await API.canAccess(
                                    req.headers.get('x-api-key') || '',
                                    this
                                )
                            ).unwrap()
                        ) {
                            const roles = (
                                await Permissions.getRoles(account)
                            ).unwrap();

                            if (
                                !this.bypasses.filter(
                                    bp =>
                                        bp.permission === DataAction.Archive ||
                                        bp.permission === '*'
                                )
                            ) {
                                if (
                                    !Permissions.canDo(
                                        roles,
                                        this,
                                        DataAction.Archive
                                    ).unwrap()
                                )
                                    return res.sendStatus(
                                        notPermittedStatus(req, 'archive')
                                    );
                            }
                        }

                        (await n.setArchive(req.body.archive)).unwrap();

                        res.sendStatus(
                            new Status(
                                {
                                    code: 200,
                                    message: `${this.data.name} archived successfully`,
                                    color: 'success',
                                    instructions: ''
                                },
                                this.data.name,
                                'Archived',
                                '{}',
                                req
                            )
                        );

                        req.io
                            // .to(n.getUniverses().unwrap())
                            // to(req.universe || '')
                            .emit(`struct:${this.data.name}:archive`, n.data);
                    }
                );
            }
            this.built = true;
        });
    }

    /**
     * Generates a new struct data
     * This will insert into the database and return the data created
     *
     * @param {St<Structure & Partial<GlobalCols>, Name>} data
     * @returns {*}
     */
    new(data: St<Structure & Partial<GlobalCols>, Name>) {
        if (!this.built)
            throw new FatalStructError(`Struct ${this.data.name} not built`);
        return attemptAsync(async () => {
            if (!this.validate(data))
                throw new StructError(`Invalid data for ${this.data.name}`);
            const verification = this.runValidators(data).unwrap();
            if (!verification.valid) {
                throw new StructError(
                    `Data from ${this.name} failed validation: ${verification.invalids.join(', ')}`
                );
            }

            const d = this.Generator({
                ...newGlobalCols(this),
                ...data // will overwrite global cols if they are included
            });

            const current = (await this.fromId(d.data.id)).unwrap();
            if (current) throw new DataError('Data already exists');

            const query = Query.build(
                `
                INSERT INTO ${this.data.name} (${Object.keys(d.data).join(', ')})
                VALUES (${Object.keys(d.data)
                    .map(k => `:${k}`)
                    .join(', ')})
                `,
                d.data as Parameter
            );

            (await this.data.database.unsafe.run(query)).unwrap();

            if (this.data.defaultUniverses?.length) {
                // log('adding to default universes', this.data.defaultUniverses);
                (await d.addUniverses(...this.data.defaultUniverses)).unwrap();
            }

            this.emit('create', d);

            return d;
        });
    }

    /**
     * Retrieves a struct data from the id
     *
     * @param {string} id
     * @returns {*}
     */
    fromId(id: string) {
        if (!this.built)
            throw new FatalStructError(`Struct ${this.data.name} not built`);
        return attemptAsync(async () => {
            const query = Query.build(
                `SELECT * FROM ${this.data.name} WHERE id = :id`,
                { id }
            );

            const data = (
                await this.data.database.unsafe.get<St<Structure, Name>>(query)
            ).unwrap();

            if (!data) return undefined;

            const invalid = !this.validate(data);
            if (invalid)
                throw new StructError(
                    `Invalid data found in database. ${this.name}:${data.id} is corrupted`
                );

            return this.Generator(data);
        });
    }

    /**
     * Retrieves struct data where the property is equal to the value
     *
     * @template {keyof Structure} Property
     * @param {Property} property
     * @param {TS_Type<Structure[Property]>} value
     * @returns {*}
     */
    fromProperty<Property extends keyof Structure>(
        property: Property,
        value: TS_Type<Structure[Property]>,
        asStream: true // filter?: (
        // ) => boolean | Promise<boolean>
    ) //     data: StructData<Structure, Name>
    : StructStream<Structure, Name>;
    fromProperty<Property extends keyof Structure>(
        property: Property,
        value: TS_Type<Structure[Property]>,
        asStream: false
    ): Promise<Result<StructData<Structure, Name>[]>>;
    fromProperty<Property extends keyof Structure>(
        property: Property,
        value: TS_Type<Structure[Property]>,
        asStream: boolean
        // filter?: (
        //     data: StructData<Structure, Name>
        // ) => boolean | Promise<boolean>
    ):
        | StructStream<Structure, Name>
        | Promise<Result<StructData<Structure, Name>[]>> {
        const query = Query.build(
            `SELECT * FROM ${this.data.name} WHERE ${property as string} = :value`,
            {
                value: value as SimpleParameter
            }
        );
        if (asStream) {
            const stream =
                this.data.database.unsafe.stream<St<Structure, Name>>(query);
            const streamer = new StructStream<Structure, Name>(this /*filter*/);
            stream.pipe(data => streamer.add(this.Generator(data)));
            stream.once('end', () => streamer.end());
            stream.once('close', () => streamer.close());
            return streamer;
        }
        return attemptAsync(async () => {
            const data = (
                await this.data.database.unsafe.all<St<Structure, Name>>(query)
            ).unwrap();

            const invalid = data.filter(d => !this.validate(d));
            if (invalid.length)
                throw new StructError(
                    `Invalid data found in database. ${this.name} is corrupted` +
                        invalid.map(d => d.id).join(', ')
                );

            return data.map(d => this.Generator(d));
        });
    }
    /**
     * Retrieves all struct data
     * Be careful using this as it can be a lot of data and could cause memory issues with large datasets
     *
     * @param {boolean} [includeArchived=false]
     * @returns {*}
     */
    all(
        asStream: true,
        includeArchived?: boolean // filter?: (
        // ) => boolean | Promise<boolean>
    ) //     data: StructData<Structure, Name>
    : StructStream<Structure, Name>;
    all(
        asStream: false,
        includeArchived?: boolean
    ): Promise<Result<StructData<Structure, Name>[]>>;
    all(
        asStream: boolean,
        includeArchived: boolean = false
        // filter?: (
        //     data: StructData<Structure, Name>
        // ) => boolean | Promise<boolean>
    ):
        | StructStream<Structure, Name>
        | Promise<Result<StructData<Structure, Name>[]>> {
        const query = Query.build(
            `SELECT * FROM ${this.data.name} WHERE archived = false;`
        );

        if (!this.built)
            throw new FatalStructError(`Struct ${this.data.name} not built`);
        if (asStream) {
            const stream =
                this.data.database.unsafe.stream<St<Structure, Name>>(query);
            const streamer = new StructStream<Structure, Name>(this /*filter*/);
            stream.pipe(data => streamer.add(this.Generator(data)));
            // stream.on('data', () => log('Stream data'));
            stream.once('end', () => streamer.end());
            stream.once('close', () => streamer.close());
            return streamer;
        }

        return attemptAsync(async () => {
            const data = (
                await this.data.database.unsafe.all<St<Structure, Name>>(query)
            ).unwrap();

            const invalid = data.filter(d => !this.validate(d));
            if (invalid.length)
                throw new StructError(
                    `Invalid data found in database. ${this.name} is corrupted` +
                        invalid.map(d => d.id).join(', ')
                );

            return data
                .map(d => this.Generator(d))
                .filter(d => includeArchived || !d.data.archived);
        });
    }

    /**
     * Retrieves all struct data from a universe
     *
     * @param {string} universe
     * @returns {*}
     */
    fromUniverse(
        universe: string,
        asStream: true // filter?: (
        // ) => boolean | Promise<boolean>
    ) //     data: StructData<Structure, Name>
    : StructStream<Structure, Name>;
    fromUniverse(
        universe: string,
        asStream: false
    ): Promise<Result<StructData<Structure, Name>[]>>;
    fromUniverse(
        universe: string,
        asStream: boolean
        // filter?: (
        //     data: StructData<Structure, Name>
        // ) => boolean | Promise<boolean>
    ):
        | StructStream<Structure, Name>
        | Promise<Result<StructData<Structure, Name>[]>> {
        const query = Query.build(
            `SELECT * FROM ${this.data.name} WHERE universes LIKE :universe`,
            {
                universe: `%${universe}%`
            }
        );
        if (asStream) {
            const stream =
                this.data.database.unsafe.stream<St<Structure, Name>>(query);
            const streamer = new StructStream<Structure, Name>(this);
            stream.pipe(data => streamer.add(this.Generator(data)));
            return streamer;
        }

        return attemptAsync(async () => {
            const data = (
                await this.data.database.unsafe.all<St<Structure, Name>>(query)
            ).unwrap();

            const invalid = data.filter(d => !this.validate(d));
            if (invalid.length)
                throw new StructError(
                    `Invalid data found in database. ${this.name} is corrupted` +
                        invalid.map(d => d.id).join(', ')
                );

            return data.map(d => this.Generator(d));
        });
    }

    /**
     * Retrieves all archived struct data
     *
     * @returns {*}
     */
    archived(
        asStream: true // filter?: (
        // ) => boolean | Promise<boolean>
    ) //     data: StructData<Structure, Name>
    : StructStream<Structure, Name>;
    archived(asStream: false): Promise<Result<StructData<Structure, Name>[]>>;
    archived(
        asStream: boolean
        // filter?: (
        //     data: StructData<Structure, Name>
        // ) => boolean | Promise<boolean>
    ):
        | StructStream<Structure, Name>
        | Promise<Result<StructData<Structure, Name>[]>> {
        if (!this.built)
            throw new FatalStructError(`Struct ${this.data.name} not built`);

        const query = Query.build(
            `SELECT * FROM ${this.data.name} WHERE archived = true`
        );

        if (asStream) {
            const stream =
                this.data.database.unsafe.stream<St<Structure, Name>>(query);
            const streamer = new StructStream<Structure, Name>(this);
            stream.pipe(data => streamer.add(this.Generator(data)));
            return streamer;
        }

        return attemptAsync(async () => {
            const data = (
                await this.data.database.unsafe.all<St<Structure, Name>>(query)
            ).unwrap();

            const invalid = data.filter(d => !this.validate(d));
            if (invalid.length)
                throw new StructError(
                    `Invalid data found in database. ${this.name} is corrupted` +
                        invalid.map(d => d.id).join(', ')
                );

            return data.map(d => this.Generator(d));
        });
    }

    /**
     * Validates the data, ensuring it matches the structure
     *
     * @param {unknown} data
     * @returns {Result<boolean>}
     */
    validate(data: unknown) {
        return prove(data, this.data.structure);
    }

    runValidators(data: Partial<Structable<Struct<Structure, Name>>>) {
        return attempt(() => {
            if (!this.data.validators)
                return {
                    valid: true,
                    results: {},
                    invalids: []
                };

            const results = Object.entries(this.data.validators || {}).reduce(
                (acc, [k, v]) => {
                    if (data[k] === undefined) return acc;
                    return {
                        ...acc,
                        [k]: v?.(data[k]) || true
                    };
                },
                {} as Record<keyof Structure, boolean>
            );

            return {
                results,
                valid: Object.values(results).every(v => v),
                invalids: Object.entries(results)
                    .filter(([_, v]) => !v)
                    .map(([k]) => k)
            };
        });
    }

    /**
     * This is the validator function for the front-end listeners
     * This will return a server function that will verify the data coming in matches the structure
     *
     * @param {boolean} defaults
     * @returns {*}
     */
    validator(defaults: boolean) {
        return validate({
            ...(defaults
                ? {
                      id: 'string',
                      created: 'string',
                      updated: 'string',
                      archived: 'boolean'
                  }
                : {}),
            ...Object.entries(this.data.structure).reduce((acc, cur) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (acc as any)[cur[0]] = type(cur[1]);
                return acc;
            }, {})
        });
    }

    /**
     * Listens for a path
     * You can use this for custom functions
     *
     * @template data
     * @param {string} path
     * @param {...ServerFunction<data>[]} fns
     * @returns {this}
     */
    listen<data>(path: string, ...fns: ServerFunction<data>[]) {
        if (path.startsWith('/')) path = path.slice(1);
        // log('Routing: ', `/${this.name}/${path}`);
        Struct.router.post(
            `/${this.name}/${path}`,
            (req, _res, next) => {
                log('Request: ', `/${this.name}/${path}`, req.body);
                next();
            },
            ...fns
        );
        return this;
    }

    /**
     * Drops the table
     * This will only work if there is no data in the table
     * If there is, it will throw an error
     *
     * @returns {*}
     */
    drop() {
        return attemptAsync(async () => {
            const all = (await this.all(false, true)).unwrap();
            if (all.length)
                throw new FatalStructError('Cannot drop table with data');
        });
    }

    clear() {
        return attemptAsync(async () => {
            const query = Query.build(`DELETE FROM ${this.data.name}`);
            (await this.data.database.unsafe.run(query)).unwrap();
        });
    }

    /**
     * Adds default data to the struct
     * BE SURE TO HAVE THE ID OF THE DATA HARD-CODED
     * The id is used to determine if the defaults exist, so if you use a function that generates ids (uuid, nanoid, etc), it will not work as it will have a different id each time the program is run and will insert new data each time
     *
     * @param {...St<Structure & Partial<GlobalCols>, Name>[]} data
     */
    addDefaults(...data: St<Structure & Partial<GlobalCols>, Name>[]) {
        if (this.built)
            throw new FatalStructError(
                `Struct ${this.data.name} already built, cannot add default data`
            );
        this.defaults.push(...data);
    }

    private imagize() {
        if (this.built)
            throw new FatalStructError(
                `${this.name}.imagize() run after struct is built`
            );
        if (this.data.sample)
            throw new FatalStructError(
                `${this.name}.imagize() run on sample struct`
            );
        return attemptAsync(async () => {
            const { structure, name } = this.data;
            const { defaults } = this;

            const image = encode(
                JSON.stringify({
                    structure,
                    name,
                    defaults
                } as StructImage<Structure>)
            );

            if (this.data.makeImage === false) return image;

            await fs.promises.mkdir(
                path.resolve(__dirname, './struct-images'),
                { recursive: true }
            );

            const exists = fs.existsSync(
                path.resolve(
                    __dirname,
                    `./struct-images/${this.name}[init].imagev1`
                )
            );

            if (!exists) {
                // if it doesn't exist, assume this is the initial state of the struct with no migrations
                await fs.promises.writeFile(
                    path.resolve(
                        __dirname,
                        `./struct-images/${this.name}[init].imagev1`
                    ),
                    image
                );
            }

            return image;
        });
    }

    deleteImage() {
        return attemptAsync(async () => {
            await fs.promises.unlink(
                path.resolve(__dirname, `./images/${this.name}.imagev1`)
            );
        });
    }

    private readonly bypasses: {
        permission: DataAction | PropertyAction | '*';
        // I don't understand why when I force the type it causes errors, so I'm using any to bypass it
        fn: (
            account: Account,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data?: any
        ) => boolean;
    }[] = [];

    bypass<Action extends DataAction | PropertyAction | '*'>(
        permission: Action,
        fn: (
            account: Account,
            data: Action extends DataAction.Create
                ? undefined
                : Data<Struct<Structure, Name>>
        ) => boolean
    ) {
        this.bypasses.push({
            permission,
            fn
        });
        return this;
    }

    getLifetimeItems(asStream: true): StructStream<Structure, Name>;
    getLifetimeItems(
        asStream: false
    ): Promise<Result<StructData<Structure, Name>[]>>;
    getLifetimeItems(asStream: boolean) {
        const query = Query.build(
            `SELECT * FROM ${this.data.name} WHERE lifetime > 0;`
        );

        if (asStream) {
            const stream =
                this.data.database.unsafe.stream<St<Structure, Name>>(query);
            const streamer = new StructStream<Structure, Name>(this);
            stream.pipe(data => {
                if (this.validate(data)) {
                    streamer.add(this.Generator(data));
                } else {
                    throw new StructError(
                        `Invalid data found in database. ${this.name} is corrupted`
                    );
                }
            });
            return streamer;
        }
        return attemptAsync(async () => {
            const data = (
                await this.data.database.unsafe.all<St<Structure, Name>>(query)
            ).unwrap();

            const invalid = data.filter(d => !this.validate(d));
            if (invalid.length)
                throw new StructError(
                    `Invalid data found in database. ${this.name} is corrupted` +
                        invalid.map(d => d.id).join(', ')
                );

            return data.map(d => this.Generator(d));
        });
    }

    forEach(fn: (data: StructData<Structure, Name>) => void) {
        const stream = this.all(true);
        stream.pipe(fn);
    }

    createMigration<From extends Blank, To extends Blank>(
        from: Migration<From>,
        to: Migration<To>,
        fn: (
            from: Structable<Struct<From, Name>>
        ) => Structable<Struct<To, Name>>
    ) {
        if (this.built)
            throw new StructMigrationError(
                `Struct ${this.name} was built before a migration. Migrations are designed to be run on an unbuilt struct.`
            );
        // create an image file for the new schema

        // check to see if migration image exists
        // if so, check schema, if they don't match prompt user to overwrite
        return attemptAsync(async () => {
            const version = (await this.database.getVersion()).unwrap();
            if (version.join('.') !== from.dbVersion.join('.')) {
                throw new StructMigrationError(
                    `Database version does not match migration "from" version`
                );
            }

            if (Version.compare(version, to.dbVersion) == 'equal') {
                // this is where we need to look at the schemas and see if there are any inconsistencies
                // If the version is equal, and the schemas are different, we need to prompt the user to destroy the database and restore the correct backup
                return;
            }

            {
                const current = (
                    await this.database.unsafe.get<{
                        name: string;
                        schema: string;
                    }>(
                        Query.build(
                            `
                    SELECT * FROM Structs
                    WHERE name = :name;
                    `,
                            {
                                name: this.name
                            }
                        )
                    )
                ).unwrap();

                if (!current)
                    throw new StructMigrationError(
                        `Struct ${this.name} does not exist in database`
                    );

                const noMatch = new StructMigrationError(
                    `Struct ${this.name} schema does not match migration schema`
                );

                const currentSchema = JSON.parse(current.schema) as Blank;

                if (
                    !Object.keys(currentSchema).every(k =>
                        Object.keys(from.schema).includes(k)
                    )
                ) {
                    throw noMatch;
                }

                if (
                    !Object.keys(from.schema).every(k =>
                        Object.keys(currentSchema).includes(k)
                    )
                ) {
                    throw noMatch;
                }

                if (
                    !Object.entries(currentSchema).every(
                        ([k, v]) => from.schema[k] === v
                    )
                ) {
                    throw noMatch;
                }
            }

            const all = (
                await this.database.unsafe.all<Structable<Struct<From, Name>>>(
                    Query.build(`
                SELECT * FROM ${this.name};
            `)
                )
            ).unwrap();

            const versionHistory = (
                await this.database.unsafe.all<
                    Structable<
                        Struct<
                            From & {
                                vhId: string;
                                vhCreated: string;
                            },
                            Name
                        >
                    >
                >(
                    Query.build(`
                SELECT * FROM ${this.name}History;
            `)
                )
            ).unwrap();

            const revert = async () => {
                await this.database.unsafe.run(
                    Query.build(`
                    DROP TABLE ${this.name};
                    DROP TABLE ${this.name}History;

                    CREATE TABLE IF NOT EXISTS ${this.name} (
                        id TEXT PRIMARY KEY,
                        created TEXT,
                        updated TEXT,
                        archived BOOLEAN,
                        lifetime INTEGER,
                        universes TEXT,
                        ${Object.entries(from.schema)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(', ')}
                    );

                    CREATE TABLE IF NOT EXISTS ${this.name}History (
                        id TEXT PRIMARY KEY,
                        created TEXT,
                        updated TEXT,
                        archived BOOLEAN,
                        lifetime INTEGER,
                        universes TEXT,
                        vhId TEXT,
                        vhCreated TEXT,
                        ${Object.entries(from.schema)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(', ')}
                    );
                `)
                );

                await Promise.all(
                    all.map(async data => {
                        if (!prove(data, to.schema).unwrap())
                            throw new StructMigrationError(
                                `Failed to revert. Data from ${this.name} does not match from schema`
                            );

                        const res = fn(data);
                        if (!prove(res, from.schema).unwrap())
                            throw new StructMigrationError(
                                `Failed to revert. Data from migration does not match to schema`
                            );

                        await this.database.unsafe.run(
                            Query.build(
                                `
                        INSERT INTO ${this.name} (${Object.keys(res).join(', ')})
                        VALUES (${Object.keys(res)
                            .map(k => `:${k}`)
                            .join(', ')})
                    `,
                                res
                            )
                        );
                    })
                );

                await Promise.all(
                    versionHistory.map(async data => {
                        if (
                            !prove(data, {
                                ...to.schema,
                                vhId: 'text',
                                vhCreated: 'text'
                            }).unwrap()
                        )
                            throw new StructMigrationError(
                                `Failed to revert. Data from ${this.name}History does not match from schema`
                            );

                        const res = fn(data);
                        // for prove function to work
                        delete res.vhId;
                        delete res.vhCreated;
                        if (!prove(res, from.schema).unwrap())
                            throw new StructMigrationError(
                                `Failed to revert. Data from migration does not match to schema`
                            );

                        Object.assign(res, {
                            vhId: data.vhId,
                            vhCreated: data.vhCreated
                        });

                        (
                            await this.database.unsafe.run(
                                Query.build(
                                    `
                        INSERT INTO ${this.name}History (${Object.keys(res).join(', ')})
                        VALUES (${Object.keys(res)
                            .map(k => `:${k}`)
                            .join(', ')})
                    `,
                                    res
                                )
                            )
                        ).unwrap();
                    })
                );

                (
                    await this.database.unsafe.run(
                        Query.build(
                            `
                    UPDATE Structs
                    SET schema = :schema
                    WHERE name = :name;
                `,
                            {
                                schema: JSON.stringify(from.schema),
                                name: this.name
                            }
                        )
                    )
                ).unwrap();
            };
            try {
                (
                    await this.database.unsafe.run(
                        Query.build(`
                    DROP TABLE ${this.name};

                    CREATE TABLE IF NOT EXISTS ${this.name} (
                        id TEXT PRIMARY KEY,
                        created TEXT,
                        updated TEXT,
                        archived BOOLEAN,
                        lifetime INTEGER,
                        universes TEXT,
                        ${Object.entries(to.schema)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(', ')}
                    );

                    DROP TABLE ${this.name}History;

                    CREATE TABLE IF NOT EXISTS ${this.name}History (
                        id TEXT PRIMARY KEY,
                        created TEXT,
                        updated TEXT,
                        archived BOOLEAN,
                        lifetime INTEGER,
                        universes TEXT,
                        vhId TEXT,
                        vhCreated TEXT,
                        ${Object.entries(to.schema)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(', ')}
                    );
                `)
                    )
                ).unwrap();

                await Promise.all(
                    all.map(async data => {
                        if (!prove(data, from.schema).unwrap())
                            throw new StructMigrationError(
                                `Data from ${this.name} does not match from schema`
                            );

                        const res = fn(data);
                        if (!prove(res, to.schema).unwrap())
                            throw new StructMigrationError(
                                `Data from migration does not match to schema`
                            );

                        await this.database.unsafe.run(
                            Query.build(
                                `
                        INSERT INTO ${this.name} (${Object.keys(res).join(', ')})
                        VALUES (${Object.keys(res)
                            .map(k => `:${k}`)
                            .join(', ')})
                        `,
                                res
                            )
                        );
                    })
                );

                await Promise.all(
                    versionHistory.map(async data => {
                        if (
                            !prove(data, {
                                ...from.schema,
                                vhId: 'text',
                                vhCreated: 'text'
                            }).unwrap()
                        )
                            throw new StructMigrationError(
                                `Data from ${this.name}History does not match from schema`
                            );

                        const res = fn(data);
                        // for prove function to work
                        delete res.vhId;
                        delete res.vhCreated;
                        if (!prove(res, to.schema).unwrap())
                            throw new StructMigrationError(
                                `Data from migration does not match to schema`
                            );

                        Object.assign(res, {
                            vhId: data.vhId,
                            vhCreated: data.vhCreated
                        });

                        (
                            await this.database.unsafe.run(
                                Query.build(
                                    `
                        INSERT INTO ${this.name}History (${Object.keys(res).join(', ')})
                        VALUES (${Object.keys(res)
                            .map(k => `:${k}`)
                            .join(', ')})
                    `,
                                    res
                                )
                            )
                        ).unwrap();
                    })
                );

                (
                    await this.database.unsafe.run(
                        Query.build(
                            `
                    UPDATE Structs
                    SET schema = :schema
                    WHERE name = :name;
                `,
                            {
                                schema: JSON.stringify(to.schema),
                                name: this.name
                            }
                        )
                    )
                ).unwrap();
            } catch (error) {
                await revert();
                throw error;
            }
        });
    }
}

type Migration<T extends Blank> = {
    dbVersion: [number, number, number];
    schema: T;
};

type Account = Data<
    Struct<
        {
            username: 'text';
            key: 'text';
            salt: 'text';
            firstName: 'text';
            lastName: 'text';
            email: 'text';
            picture: 'text';
            verified: 'boolean';
            verification: 'text';
        },
        'Account'
    >
>;
