/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Encodes bigints to strings so they can be used in JSONs
 * @date 3/8/2024 - 6:41:49 AM
 *
 * @param {unknown} obj
 * @returns {*}
 */
export const bigIntEncode = (obj: unknown): any => {
    if (!obj) return obj;
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) return obj.map(bigIntEncode);
        const newObj: {
            [key: string]: unknown;
        } = {};
        for (const key in obj) {
            newObj[key] = bigIntEncode((obj as any)[key]);
        }
        return newObj;
    }
    if (typeof obj === 'bigint') return obj.toString() + 'n';
    return obj;
};

/**
 * Decodes object with custom bigint strings to bigints
 * @date 3/8/2024 - 6:41:49 AM
 *
 * @param {unknown} obj
 * @returns {*}
 */
export const bigIntDecode = (obj: unknown): any => {
    if (!obj) return obj;
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) return obj.map(bigIntDecode);
        const newObj: {
            [key: string]: unknown;
        } = {};
        for (const key in obj) {
            newObj[key] = bigIntDecode((obj as any)[key]);
        }
        return newObj;
    }

    const decodeStr = (str: string) => {
        const match = str.match(/^(-?\d+)n$/);
        if (match) {
            // if number is below 2^53, return it as a number
            const num = Number(match[1]);
            if (num <= 9007199254740991 && num >= -9007199254740991) {
                return num;
            }
            return BigInt(match[1]);
        }
        return str;
    };

    if (typeof obj === 'bigint') return decodeStr(obj.toString() + 'n');
    if (typeof obj === 'string') return decodeStr(obj);
    return obj;
};

/**
 * Description placeholder
 * @date 3/8/2024 - 6:41:49 AM
 *
 * @param {{
 *         [key: string]: string | number | boolean | undefined;
 *     }[]} data
 * @returns {*}
 */
export const toTable = (
    data: {
        [key: string]: string | number | boolean | undefined;
    }[]
) => {
    const headers: string[] = [];
    const rows = data.map(row => {
        const moreHeaders = Object.keys(row).filter(
            key => !headers.includes(key)
        );
        if (moreHeaders.length > 0) {
            headers.push(...moreHeaders);
        }
        return headers.map(header => row[header]);
    });

    rows.unshift(headers);
    return rows;
};
