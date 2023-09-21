
// text functions

/**
 * Capitalizes the first letter of every word in a string
 * @param str 
 * @returns 
 */
export const capitalize = (str: string): string => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

/**
 * Converts any string to camelCase
 * @param str 
 * @returns 
 */
export const toCamelCase = (str: string): string => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');

/**
 * Converts a string to snake_case
 * @param str 
 * @returns 
 */
export const toSnakeCase = (str: string, del: string = '_'): string => str.replace(/([A-Z])/g, (g) => `${del}${g[0].toLowerCase()}`).replace(/\s+/g, '_');


/**
 * Converts a string from camelCase to "camel case"
 * @param str 
 * @returns 
 */
export const fromCamelCase = (str: string): string => str.replace(/([A-Z])/g, (g) => ` ${g[0].toLowerCase()}`);

/**
 * Converts a string from snake_case to "snake case"
 * @param str 
 * @returns 
 */
export const fromSnakeCase = (str: string, del: string = '_'): string => str.replace(/([A-Z])/g, (g) => ` ${g[0].toLowerCase()}`).replace(del, ' ');