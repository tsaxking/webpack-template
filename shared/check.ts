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

    handle(value: T) {
        return new Ok(value);
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
    parseError?: (error: Error) => E,
): Result<T, E> => {
    try {
        return new Ok(fn());
    } catch (e) {
        if (parseError) {
            const err = attempt(
                () => parseError(e),
                (e) => 'Error parsing error: ' + e,
            );
            if (err.isOk()) {
                // console.warn(err.value);
                return new Err(err.value);
            }
            // console.warn(err.error, e);
            return new Err(e);
        }
        // console.warn(e);
        return new Err(e);
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
    parseError?: (error: Error) => E,
): Promise<Result<T, E>> => {
    try {
        return new Ok(await fn());
    } catch (e) {
        if (parseError) {
            const err = attempt(
                () => parseError(e),
                (e) => 'Error parsing error: ' + e,
            );
            if (err.isOk()) {
                // console.warn(err.value);
                return new Err(err.value);
            }
            // console.warn(err.error, e);
            return new Err(e);
        }
        // console.warn(e);
        return new Err(e);
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
    [key: string]: Primitive | O | A;
};

/**
 * Array type (only supports one type)
 * @date 1/28/2024 - 5:40:39 AM
 *
 * @typedef {A}
 */
type A = [Primitive | O | A];

/**
 * Checks if the data matches the type
 * @date 1/28/2024 - 5:40:39 AM
 */
export const check = (data: unknown, type: Primitive | O | A): boolean => {
    const isPrimitive = (data: unknown, type: Primitive): boolean =>
        typeof data === type;
    const isObject = (data: unknown): data is O =>
        typeof data === 'object' && data !== null;
    const isArray = (data: unknown): data is A => Array.isArray(data);
    try {
        JSON.stringify(data);
    } catch (error) {
        console.error(
            'Invalid data, it is likely that you have a circular reference in your "data" definition',
        );
        return false;
    }

    try {
        JSON.stringify(type);
    } catch (error) {
        console.error(
            'Invalid type, it is likely that you have a circular reference in your "type" definition',
        );
        return false;
    }

    const runCheck = (data: unknown, type: Primitive | O | A): boolean => {
        if (typeof type === 'string') {
            return isPrimitive(data, type);
        }

        if (isArray(type)) {
            return (
                isArray(data) &&
                data.every((item) => type.some((t) => runCheck(item, t)))
            );
        }

        if (isObject(data) && isObject(type)) {
            return Object.keys(type).every((key) =>
                runCheck(data[key], type[key])
            );
        }

        return false;
    };

    return runCheck(data, type);
};

export const resolveAll = <T>(results: Result<T>[]): Result<T[]> => {
    if (results.some((r) => r.isErr())) {
        const e = results.find((r) => r.isErr());
        if (e && e.isErr()) {
            // this should always be true
            return new Err(e.error);
        }
    }

    return new Ok(
        results.map((r) => {
            if (r.isOk()) {
                return r.value;
            }
            return null as T; // this should never happen
        }),
    );
};
