import { match } from './match';

/**
 * Basic SQL Types, there will be more added as needed
 *
 * @export
 * @typedef {SQL_Type}
 */
export type SQL_Type =
    | 'integer'
    | 'bigint'
    | 'text'
    | 'boolean'
    | 'real'
    | 'numeric';

/**
 * Primitive types that SQL_Types can be converted to
 *
 * @export
 * @typedef {TS_Types}
 */
export type TS_Types = 'number' | 'string' | 'object' | 'boolean' | 'unknown';

/**
 * Converts a SQL_Type to a TS_TypeStr
 *
 * @template {SQL_Type} T
 * @param {T} type
 * @returns {TS_TypeStr<T>}
 */
export const type = <T extends SQL_Type>(type: T): TS_TypeStr<T> => {
    switch (type) {
        case 'integer':
        case 'bigint':
        case 'real':
        case 'numeric':
            return 'number' as TS_TypeStr<T>;
        case 'text':
            return 'string' as TS_TypeStr<T>;
        case 'boolean':
            return 'boolean' as TS_TypeStr<T>;
        default:
            return 'unknown';
    }
};

export const typeValidation = <T extends SQL_Type>(
    t: T,
    data: unknown
): boolean => {
    return typeof data === type(t);
};

/**
 * Converts a SQL_Type to a real type
 *
 * @export
 * @typedef {TS_Type}
 * @template {SQL_Type} T
 */
export type TS_Type<T extends SQL_Type> =
    | (T extends 'integer'
          ? number
          : T extends 'bigint'
            ? number
            : T extends 'text'
              ? string
              : T extends 'json'
                ? object
                : T extends 'boolean'
                  ? boolean
                  : T extends 'real'
                    ? number
                    : T extends 'numeric'
                      ? number
                      : never)
    | unknown;

// for runtime
/**
 * Used to convert a SQL_Type to a TS_Type strings (result of typeof)
 *
 * @export
 * @typedef {TS_TypeStr}
 * @template {SQL_Type} T
 */
export type TS_TypeStr<T extends SQL_Type> =
    | (T extends 'integer'
          ? 'number'
          : T extends 'bigint'
            ? 'number'
            : T extends 'text'
              ? 'string'
              : T extends 'json'
                ? 'object'
                : T extends 'boolean'
                  ? 'boolean'
                  : T extends 'real'
                    ? 'number'
                    : T extends 'numeric'
                      ? 'number'
                      : never)
    | 'unknown';

/**
 * Converts TS_Type to the real type
 *
 * @export
 * @typedef {TS_TypeActual}
 * @template {TS_Types} T
 */
export type TS_TypeActual<T extends TS_Types> = T extends 'number'
    ? number
    : T extends 'string'
      ? string
      : T extends 'object'
        ? object
        : T extends 'boolean'
          ? boolean
          : never;

/**
 * All of the global columns for all structs
 *
 * @export
 * @typedef {GlobalCols}
 */
export type GlobalCols = {
    id: 'text';
    created: 'text';
    updated: 'text';
    archived: 'boolean';
    attributes: 'text';
    universes: 'text';
    lifetime: 'integer';
};

/**
 * Ts typed global columns
 *
 * @export
 * @typedef {TS_GlobalCols}
 */
export type TS_GlobalCols = {
    id: string;
    created: string;
    updated: string;
    archived: boolean;
    attributes: string;
    universes: string;
    lifetime: number;
};

/**
 * Template struct class structure
 *
 * @export
 * @typedef {Blank}
 */
export type Blank = {
    [key: string]: SQL_Type;
};

export const checkStrType = (str: string, type: SQL_Type): boolean => {
    switch (type) {
        case 'text':
            return true;
        case 'integer':
            return Number.isInteger(+str);
        case 'numeric':
        case 'real':
            return !Number.isNaN(+str);
        case 'bigint':
            return !Number.isNaN(+str) || BigInt(str).toString() === str;
        case 'boolean':
            return ['y', 'n', '1', '0', 'true', 'false'].includes(str);
        default:
            return false;
    }
};

export const returnType = (str: string, type: SQL_Type) => {
    return match(type)
        .case('text', () => str)
        .case('integer', () => +str)
        .case('numeric', () => +str)
        .case('real', () => +str)
        .case('bigint', () => BigInt(str))
        .case('boolean', () => ['y', '1', 'true'].includes(str))
        .exec()
        .unwrap();
};

export enum PropertyAction {
    Read = 'read',
    Update = 'update'
}

// these are not property specific
export enum DataAction {
    Create = 'create',
    Delete = 'delete',
    Archive = 'archive',
    RestoreArchive = 'restore-archive',
    RestoreVersion = 'restore-version',
    DeleteVersion = 'delete-version',
    ReadVersionHistory = 'read-version-history',
    ReadArchive = 'read-archive'
}
