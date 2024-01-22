export class Ok<T = unknown> {
    public readonly ok = true;
    constructor(public readonly value: T) {}

    isOk(): this is Ok<T> {
        return true;
    }

    isErr(): this is Err {
        return false;
    }
}

export class Err<E = Error> {
    public readonly ok = false;
    constructor(public readonly error: E) {}

    isOk(): this is Ok {
        return false;
    }

    isErr(): this is Err<E> {
        return true;
    }
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Surrounds a function with a try/catch block and returns the result of the function or null if an error is thrown
 * @date 1/9/2024 - 12:05:02 PM
 */
export const attempt = <T = unknown, E = Error>(
    fn: (...params: unknown[]) => T,
    parseError?: (error: Error) => E,
): Result<T, E> => {
    try {
        return new Ok(fn());
    } catch (e) {
        if (parseError) {
            const err = parseError(e);
            console.warn(err);
            return new Err(err);
        }
        console.warn(e);
        return new Err(e);
    }
};

/**
 * Surrounds an async function with a try/catch block and returns the result of the function or null if an error is thrown
 * @date 1/9/2024 - 12:05:02 PM
 *
 * @async
 */
export const attemptAsync = async <T = unknown, E = Error>(
    fn: (...params: unknown[]) => Promise<T>,
    parseError?: (error: Error) => E,
): Promise<Result<T, E>> => {
    try {
        return new Ok(await fn());
    } catch (e) {
        if (parseError) {
            const err = parseError(e);
            return new Err(err);
        }
        console.warn(e);
        return new Err(e);
    }
};
