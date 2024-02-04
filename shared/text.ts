// text functions

/**
 * Capitalizes the first letter of every word in a string
 * @param str
 * @returns
 */
export const capitalize = (str: string): string =>
    str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );

/**
 * Converts any string to camelCase
 * @param str
 * @returns
 */
export const toCamelCase = (str: string): string =>
    str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase())
        .replace(/\s+/g, '');

/**
 * Converts a string to snake_case
 * @param str
 * @returns
 */
export const toSnakeCase = (str: string, del = '_'): string =>
    str
        .replace(/([A-Z])/g, (g) => `${del}${g[0].toLowerCase()}`)
        .replace(/\s+/g, '_');

/**
 * Converts a string from camelCase to "camel case"
 * @param str
 * @returns
 */
export const fromCamelCase = (str: string): string =>
    str.replace(/([A-Z])/g, (g) => ` ${g[0].toLowerCase()}`);

/**
 * Converts a string from snake_case to "snake case"
 * @param str
 * @returns
 */
export const fromSnakeCase = (str: string, del = '_'): string =>
    str.replace(/([A-Z])/g, (g) => ` ${g[0].toLowerCase()}`).replace(del, ' ');

/**
 * Abbreviates a string to a given length (appending ...)
 * @date 1/9/2024 - 12:04:06 PM
 */
export const abbreviate = (string: string, length = 10): string => {
    if (length < 3) throw new Error('Abbreviation length must be at least 3');

    if (string.length <= length) return string;
    return string.substring(0, length - 3) + '...';
};

/**
 * Used for streams, you can ignore this
 * @date 1/9/2024 - 12:04:06 PM
 *
 * @type {"<"}
 */
export const streamDelimiter = '<';

export const toByteString = (byte: number): string => {
    const sizes = {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776,
    };

    const i = Math.floor(Math.log(byte) / Math.log(1024));
    return `${(byte / sizes[Object.keys(sizes)[i]]).toFixed(2)} ${
        Object.keys(sizes)[i]
    }`;
};
