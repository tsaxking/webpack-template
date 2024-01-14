type __A = Record<string | number | symbol, never>;
interface JSON {
    /**
     * Converts a JavaScript Object Notation (JSON) string into an object.
     * @param text A valid JSON string.
     * @param reviver A function that transforms the results. This function is called for each member of the object.
     * If a member contains nested objects, the nested objects are transformed before the parent object is.
     */
    parse(
        text: string,
        reviver?: (this: any, key: string, value: any) => any,
    ): unknown;
}

interface ArrayConstructor {
    isArray(arg: any): arg is unknown[];
}

interface ReadonlyArray<T> {
    includes(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): boolean;
}

interface Array<T> {
    includes(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): boolean;
}

interface ReadonlyArray<T> {
    lastIndexOf(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): number;
    indexOf(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): number;
}

interface Array<T> {
    lastIndexOf(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): number;
    indexOf(
        searchElement: T | (TSReset.WidenLiteral<T> & __A),
        fromIndex?: number,
    ): number;
}

interface Body {
    json(): Promise<unknown>;
}

interface Array<T> {
    filter(predicate: BooleanConstructor, thisArg?: any): TSReset.NonFalsy<T>[];
}

interface ReadonlyArray<T> {
    filter(predicate: BooleanConstructor, thisArg?: any): TSReset.NonFalsy<T>[];
}

interface Map<K, V> {
    has(value: K | (TSReset.WidenLiteral<K> & __A)): boolean;
}

interface ReadonlyMap<K, V> {
    has(value: K | (TSReset.WidenLiteral<K> & __A)): boolean;
}

interface Set<T> {
    has(value: T | (TSReset.WidenLiteral<T> & __A)): boolean;
}

interface ReadonlySet<T> {
    has(value: T | (TSReset.WidenLiteral<T> & __A)): boolean;
}

interface Storage {
    [name: string & __A]: unknown;
}

declare namespace TSReset {
    type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never
        : T;

    type WidenLiteral<T> = T extends string ? string
        : T extends number ? number
        : T extends boolean ? boolean
        : T extends bigint ? bigint
        : T extends symbol ? symbol
        : T;
}
