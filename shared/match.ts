// Purpose: Provides a match-case statement for TypeScript similar to Rust's match statement

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The signature of a case in a match statement
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @typedef {Case}
 * @template [T=unknown]
 * @template [A=unknown]
 */
type Case<T = unknown, A = unknown> = [
    predicate: (value: T) => boolean,
    fn: (value: T) => A
];

/**
 * Matches a value to a case and returns the result of the case
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @template [Type=unknown]
 * @template [ReturnType=unknown]
 * @param {Type} value
 * @param {...Case<Type, ReturnType>[]} cases
 * @returns {(ReturnType | null)}
 */
export const match = <Type = unknown, ReturnType = unknown>(
    value: Type,
    ...cases: Case<Type, ReturnType>[]
): ReturnType | null => {
    for (const [predicate, fn] of cases) {
        if (predicate(value)) {
            return fn(value);
        }
    }
    return null;
};

/**
 * Interface case
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @typedef {iCase}
 * @template A
 */
type iCase<A> = [predicate: any, fn: (value: unknown) => A];

/**
 * Matches a value to a case and returns the result of the case
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @template [Type=unknown]
 * @template [ReturnType=unknown]
 * @param {Type} value
 * @param {...iCase<ReturnType>[]} cases
 * @returns {(ReturnType | null)}
 */
export const matchInstance = <Type = unknown, ReturnType = unknown>(
    value: Type,
    ...cases: iCase<ReturnType>[]
): ReturnType | null => {
    for (const [predicate, fn] of cases) {
        if (value instanceof predicate) {
            return fn(value);
        }
    }
    return null;
};

/**
 * All primitive types
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @typedef {Primitive}
 */
type Primitive = string | number | boolean | null | undefined | symbol | bigint;

/**
 * Primitive case
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @typedef {PrimitiveCase}
 * @template A
 */
type PrimitiveCase<A> = [predicate: Primitive, fn: (value: Primitive) => A];

/**
 * Matches a value to a case and returns the result of the case
 * @date 3/8/2024 - 6:40:09 AM
 *
 * @template [ReturnType=unknown]
 * @param {Primitive} value
 * @param {...PrimitiveCase<ReturnType>[]} cases
 * @returns {(ReturnType | null)}
 */
export const matchPrimitive = <ReturnType = unknown>(
    value: Primitive,
    ...cases: PrimitiveCase<ReturnType>[]
): ReturnType | null => {
    for (const [predicate, fn] of cases) {
        if (value === predicate) {
            return fn(value);
        }
    }
    return null;
};
