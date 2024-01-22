declare function create<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: any,
): HTMLElementTagNameMap[K];
declare function create<K extends keyof HTMLElementDeprecatedTagNameMap>(
    tag: string,
    attrs?: any,
): HTMLElementDeprecatedTagNameMap[K];
declare function create(tag: string, attrs?: any): HTMLElement;

declare function createDeep(
    tag: string,
    attrs?: any,
): (
    | HTMLElementDeprecatedTagNameMap[keyof HTMLElementDeprecatedTagNameMap]
    | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
    | HTMLElement
)[];

declare function select<K extends keyof HTMLElementTagNameMap>(
    selector: K,
): HTMLElementTagNameMap[K];
declare function select<K extends keyof HTMLElementDeprecatedTagNameMap>(
    selector: string,
): HTMLElementDeprecatedTagNameMap[K];
declare function select(selector: string): HTMLElement;
