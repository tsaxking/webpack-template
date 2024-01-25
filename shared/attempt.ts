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
export class Err<E = Error> {
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
export type Result<T, E = Error> = Ok<T> | Err<E>;

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
                console.warn(err.value);
                return new Err(err.value);
            }
            console.warn(err.error, e);
            return new Err(e);
        }
        console.warn(e);
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
                console.warn(err.value);
                return new Err(err.value);
            }
            console.warn(err.error, e);
            return new Err(e);
        }
        console.warn(e);
        return new Err(e);
    }
};
