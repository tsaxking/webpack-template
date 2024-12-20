/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates an element with the specified tag name.
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {?*} [attrs]
 * @returns {HTMLElementTagNameMap[K]}
 */
declare function create<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: any
): HTMLElementTagNameMap[K];
/**
 * Creates an element with the specified tag name.
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementDeprecatedTagNameMap} K
 * @param {string} tag
 * @param {?*} [attrs]
 * @returns {HTMLElementDeprecatedTagNameMap[K]}
 */
declare function create<K extends keyof HTMLElementDeprecatedTagNameMap>(
    tag: string,
    attrs?: any
): HTMLElementDeprecatedTagNameMap[K];
/**
 * Creates an element with the specified tag name.
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @param {string} tag
 * @param {?*} [attrs]
 * @returns {HTMLElement}
 */
declare function create(tag: string, attrs?: any): HTMLElement;
/**
 * Creates an element with the specified html.
 * @date 1/21/2024 - 8:39:51 PM
 *
 * @param {string} html
 * @param {?*} [attrs]
 * @returns {HTMLElement}
 */
declare function create(html: string, attrs?: any): HTMLElement;

/**
 * Creates an element with the specified html, returning all children as an array
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @param {string} tag
 * @param {?*} [attrs]
 * @returns {(
 *     | HTMLElementDeprecatedTagNameMap[keyof HTMLElementDeprecatedTagNameMap]
 *     | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
 *     | HTMLElement
 * )[]}
 */
declare function createDeep(
    tag: string,
    attrs?: any
): (
    | HTMLElementDeprecatedTagNameMap[keyof HTMLElementDeprecatedTagNameMap]
    | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
    | HTMLElement
)[];

/**
 * Using querySelector, returns the first element that matches the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} selector
 * @returns {HTMLElementTagNameMap[K]}
 */
declare function find<K extends keyof HTMLElementTagNameMap>(
    selector: K
): HTMLElementTagNameMap[K];
/**
 * Using querySelector, returns the first element that matches the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementDeprecatedTagNameMap} K
 * @param {string} selector
 * @returns {HTMLElementDeprecatedTagNameMap[K]}
 */
declare function find<K extends keyof HTMLElementDeprecatedTagNameMap>(
    selector: string
): HTMLElementDeprecatedTagNameMap[K];
/**
 * Using querySelector, returns the first element that matches the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @param {string} selector
 * @returns {HTMLElement}
 */
declare function find(selector: string): HTMLElement;

/**
 * Using querySelectorAll, returns all elements that match the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} selector
 * @returns {HTMLElementTagNameMap[K][]}
 */
declare function findAll<K extends keyof HTMLElementTagNameMap>(
    selector: K
): HTMLElementTagNameMap[K][];

/**
 * Using querySelectorAll, returns all elements that match the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @template {keyof HTMLElementDeprecatedTagNameMap} K
 * @param {string} selector
 * @returns {HTMLElementDeprecatedTagNameMap[K][]}
 */
declare function findAll<K extends keyof HTMLElementDeprecatedTagNameMap>(
    selector: string
): HTMLElementDeprecatedTagNameMap[K][];

/**
 * Using querySelectorAll, returns all elements that match the selector
 * @date 1/21/2024 - 8:39:08 PM
 *
 * @param {string} selector
 * @returns {HTMLElement[]}
 */
declare function findAll(selector: string): HTMLElement[];

declare const recaptchaSiteKey: string;
