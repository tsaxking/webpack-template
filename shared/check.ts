// Purpose: Errors as types

/**
 * Ok Result
 * @date 1/22/2024 - 2:56:57 AM
 *
 * @export
 * @class Ok
 * @typedef {Ok}
 * @template [T=unknown]
 */
export class Ok<T = unknown> {
    /**
     * Creates an instance of Ok.
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @constructor
     * @param {T} value
     */
    constructor(public readonly value: T) {}

    /**
     * Returns true if the result is Ok
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @returns {this is Ok<T>}
     */
    isOk(): this is Ok<T> {
        return true;
    }

    /**
     * Returns true if the result is Err
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @returns {this is Err}
     */
    isErr(): this is Err {
        return false;
    }

    /**
     * Unwraps the result
     * ONLY USE FOR TESTING OR WITHIN OTHER ATTEMPTS
     *
     * @returns {T}
     */
    unwrap(): T {
        // console.warn(
        //     'Warning: Unwrapping Ok result, this is not recommended for anything other than testing.'
        // );
        return this.value;
    }

    /**
     * If the result is an error, throw an error with the message
     * ONLY USE FOR TESTING OR WITHIN OTHER ATTEMPTS
     *
     * @param {string} message
     * @returns {T}
     */
    expect(_message: string): T {
        // console.warn(
        //     'Warning: Expecting Ok result, this is not recommended for anything other than testing.'
        // );
        return this.value;
    }
}

/**
 * Err Result
 * @date 1/22/2024 - 2:56:57 AM
 *
 * @export
 * @class Err
 * @typedef {Err}
 * @template [E=Error]
 */
export class Err<E = Error, T = unknown> {
    /**
     * Creates an instance of Err.
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @constructor
     * @param {E} error
     */
    constructor(public readonly error: E) {}

    /**
     * Returns true if the result is Ok
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @returns {this is Ok}
     */
    isOk(): this is Ok {
        return false;
    }

    /**
     * Returns true if the result is Err
     * @date 1/22/2024 - 2:56:57 AM
     *
     * @returns {this is Err<E>}
     */
    isErr(): this is Err<E> {
        return true;
    }

    /**
     * Converts the result to an Ok
     *
     * @param {T} value
     * @returns {Ok<T>}
     */
    handle(value: T) {
        return new Ok(value);
    }

    /**
     * Unwraps the result
     * ONLY USE FOR TESTING OR WITHIN OTHER ATTEMPTS
     *
     * @returns {T}
     */
    unwrap(): T {
        // console.warn(
        //     'Warning: Unwrapping Err result, this is not recommended for anything other than testing.'
        // );
        throw this.error;
    }

    /**
     * If the result is an error, throw an error with the message
     * ONLY USE FOR TESTING OR WITHIN OTHER ATTEMPTS
     *
     * @param {string} message
     * @returns {T}
     */
    expect(message: string): T {
        // console.warn(
        //     'Warning: Expecting Err result, this is not recommended for anything other than testing.'
        // );
        throw new Error(message);
    }
}

/**
 * Result, Ok or Err
 * @date 1/22/2024 - 2:56:57 AM
 *
 * @export
 * @typedef {Result}
 * @template T
 * @template [E=Error]
 */
export type Result<T, E = Error> = Ok<T> | Err<E, T>;

/**
 * Attempts to run a function, returning a Result
 * @date 1/22/2024 - 2:56:57 AM
 */
export const attempt = <T = unknown, E = Error>(
    fn: () => T,
    parseError?: (error: Error) => E
): Result<T, E> => {
    try {
        return new Ok(fn());
    } catch (e) {
        // console.error('[check.ts]', e);
        if (parseError) {
            const err = attempt(
                () => parseError(e as Error),
                e => 'Error parsing error: ' + e
            );
            if (err.isOk()) {
                // console.warn(err.value);
                return new Err(err.value);
            }
            // console.warn(err.error, e);
            return new Err(e) as Result<T, E>;
        }
        // console.warn(e);
        return new Err(e) as Result<T, E>;
    }
};
/**
 * Attempts to run an async function, returning a Promise<Result>
 * @date 1/22/2024 - 2:56:56 AM
 *
 * @async
 */
export const attemptAsync = async <T = unknown, E = Error>(
    fn: () => Promise<T>,
    parseError?: (error: Error) => E
): Promise<Result<T, E>> => {
    try {
        return new Ok(await fn());
    } catch (e) {
        if (parseError) {
            const err = attempt(
                () => parseError(e as Error),
                e => 'Error parsing error: ' + e
            );
            if (err.isOk()) {
                // console.warn(err.value);
                return new Err(err.value);
            }
            // console.warn(err.error, e);
            return new Err(e) as Result<T, E>;
        }
        // console.warn(e);
        return new Err(e) as Result<T, E>;
    }
};

/**
 * All primitive types
 * @date 1/28/2024 - 5:40:39 AM
 *
 * @typedef {Primitive}
 */
type Primitive =
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null'
    | 'undefined';

/**
 * Object type
 * @date 1/28/2024 - 5:40:39 AM
 *
 * @typedef {O}
 */
type O = {
    [key: string]: isValid;
};

/**
 * Array type (only supports one type)
 * @date 1/28/2024 - 5:40:39 AM
 *
 * @typedef {A}
 */
type A = isValid[];

type Fn = (data: unknown) => boolean;

export type isValid = Primitive | O | A | Fn;

/**
 * Checks if the data matches the type
 * @date 1/28/2024 - 5:40:39 AM
 */
export const check = (data: unknown, type: isValid): boolean => {
    const isPrimitive = (data: unknown, type: Primitive): boolean =>
        typeof data === type;
    const isObject = (data: unknown): data is O =>
        typeof data === 'object' && data !== null;
    const isArray = (data: unknown): data is A => Array.isArray(data);
    const isFunction = (data: unknown): data is Fn =>
        typeof data === 'function';
    try {
        JSON.stringify(data);
    } catch (error) {
        console.error(
            'Invalid data, it is likely that you have a circular reference in your "data" definition'
        );
        return false;
    }

    try {
        JSON.stringify(type);
    } catch (error) {
        console.error(
            'Invalid type, it is likely that you have a circular reference in your "type" definition'
        );
        return false;
    }

    const runCheck = (data: unknown, type: isValid): boolean => {
        if (isFunction(type)) {
            return type(data);
        }

        if (typeof type === 'string') {
            return isPrimitive(data, type);
        }

        if (isArray(type)) {
            if (isArray(data)) {
                // data is an array, type is an array. Check if all elements match any of the types
                return data.every(d => type.some(t => runCheck(d, t)));
            }
            if (type.length === 1) return false; // data is supposed to be an array
            return type.some(t => runCheck(data, t)); // data is not an array, type is supposed to be an "or" type
        }

        if (isObject(data) && isObject(type)) {
            return Object.keys(type).every(key =>
                runCheck(data[key], type[key])
            );
        }

        return false;
    };

    return runCheck(data, type);
};

export const isSimilar = (a: unknown, b: unknown): boolean => {
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => isSimilar(v, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a) as (keyof typeof a)[];
        const bKeys = Object.keys(b) as (keyof typeof b)[];
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every(k => isSimilar(a[k], b[k]));
    }
    return false;
};

/**
 * Converts an array of results to a single result
 * The return type of all results must be the same
 *
 * @template T
 * @param {Result<T>[]} results
 * @returns {Result<T[]>}
 */
export const resolveAll = <T>(results: Result<T>[]): Result<T[]> => {
    if (results.some(r => r.isErr())) {
        const e = results.find(r => r.isErr());
        if (e && e.isErr()) {
            // this should always be true
            return new Err(e.error);
        }
    }

    return new Ok(
        results.map(r => {
            if (r.isOk()) {
                return r.value;
            }
            return null as T; // this should never happen
        })
    );
};

export const build = <T extends Primitive | O | A>(
    data: unknown,
    type: T
): Result<ReturnType<T>> => {
    return attempt(() => {
        if (check(data, type)) {
            return data as ReturnType<T>;
        }
        throw new Error('Data does not match type');
    });
};

export const parseJSON = <T extends Primitive | O | A>(
    data: string,
    obj: T
): Result<ReturnType<T>> => {
    return build(JSON.parse(data), obj);
};

export type ReturnType<T> = T extends 'string'
    ? string
    : T extends 'number'
      ? number
      : T extends 'boolean'
        ? boolean
        : T extends 'object'
          ? object
          : T extends 'array'
            ? unknown[]
            : T extends 'null'
              ? null
              : T extends 'undefined'
                ? undefined
                : T extends O
                  ? { [K in keyof T]: ReturnType<T[K]> }
                  : T extends A
                    ? ReturnType<T[0]>[]
                    : never;
