/* eslint-disable @typescript-eslint/no-explicit-any */
type Case<T = unknown, A = unknown> = [
    predicate: (value: T) => boolean,
    fn: (value: T) => A
];

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

type iCase<A> = [predicate: any, fn: (value: unknown) => A];

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

type Primitive = string | number | boolean | null | undefined | symbol | bigint;

type PrimitiveCase<A> = [predicate: Primitive, fn: (value: Primitive) => A];

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
