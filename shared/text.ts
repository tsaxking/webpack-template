// text functions

/**
 * Capitalizes the first letter of every word in a string
 * @param str
 * @returns
 */
export const capitalize = (str: string): string =>
    str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substring(1)
    );

/**
 * Converts any string to camelCase
 * @param str
 * @returns
 */
export const toCamelCase = (str: string): string =>
    str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');

/**
 * Converts a string to snake_case
 * @param str
 * @returns
 */
export const toSnakeCase = (str: string, del = '_'): string =>
    str
        .replace(/([A-Z])/g, g => `${del}${g[0].toLowerCase()}`)
        .replace(/\s+/g, '_');

/**
 * Converts a string from camelCase to "camel case"
 * @param str
 * @returns
 */
export const fromCamelCase = (str: string): string =>
    str.replace(/([A-Z])/g, g => ` ${g[0].toLowerCase()}`);

/**
 * Converts a string from snake_case to "snake case"
 * @param str
 * @returns
 */
export const fromSnakeCase = (str: string, del = '_'): string =>
    str
        .replace(/([A-Z])/g, g => ` ${g[0].toLowerCase()}`)
        .replace(new RegExp(del, 'g'), ' ');

export const streamDelimiter = '<';

/**
 * Abbreviates a string to a given length (appending ...)
 * @date 1/9/2024 - 12:04:06 PM
 */ export const abbreviate = (string: string, length = 10): string => {
    if (length < 3) throw new Error('Abbreviation length must be at least 3');

    if (string.length <= length) return string;
    return string.substring(0, length - 3) + '...';
};

export const toByteString = (byte: number): string => {
    const sizes = {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776
    };

    const i = Math.floor(Math.log(byte) / Math.log(1024));
    return `${(byte / sizes[Object.keys(sizes)[i] as keyof typeof sizes]).toFixed(2)} ${
        Object.keys(sizes)[i]
    }`;
};

/**
 * Parses each key of an object with a given parser (used to deCamelCase keys and stuff...)
 * @date 2/7/2024 - 1:47:58 PM
 */
export const parseObject = (
    obj: object,
    parser: (str: string) => string
): unknown => {
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj))
        return obj.map(o => parseObject(o as object, parser));
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // only do the keys, not the values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newObj[parser(key)] = (obj as any)[key];
        }
    }
    return newObj;
};

export const fmtNumber = (num: number | string): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const cost = (amount: number | string): string => {
    return +amount >= 0
        ? `$${fmtNumber((+amount).toFixed(2))}`
        : `-$${Math.abs(+amount).toFixed(2)}`;
};

export const encode = (str: string) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-=!@#$%^&*()_+[]{}|;:\'",.<>?/`~\\\n ';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        result += chars.indexOf(char).toString().padStart(2, '0');
    }

    return result;
};

export const decode = (str: string) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-=!@#$%^&*()_+[]{}|;:\'",.<>?/`~\\\n ';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str.slice(i, i + 2);
        result += chars[parseInt(char)];
        i++;
    }

    return result;
};

export const removeWhitespace = (str: string): string => {
    const res = str
        .replaceAll('  ', ' ')
        .replaceAll('    ', ' ')
        .replace('\n', ' ')
        .replace(/\t/g, ' ');
    if (res === str) return res;
    return removeWhitespace(res);
};

export const toBinary = (num: number): string => {
    return num.toString(2);
};

export const fromBinary = (bin: string): number => {
    return parseInt(bin, 2);
};

export const merge = (a: string, b: string): string => {
    // merge two strings together

    const common = (a: string, b: string) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.substring(0, i);
    };
    const c = common(a, b);

    a = a.substring(c.length);
    b = b.substring(c.length);

    if (a.length === 0 && b.length === 0) return c;
    if (a.length === 0) return c + b;
    if (b.length === 0) return c + a;
    return c;
};
