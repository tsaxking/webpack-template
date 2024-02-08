export const bigIntEncode = (obj: unknown) => {
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) return obj.map(bigIntEncode);
        const newObj: {
            [key: string]: unknown;
        } = {};
        for (const key in obj) {
            newObj[key] = bigIntEncode(obj[key]);
        }
        return newObj;
    }
    if (typeof obj === 'bigint') return obj.toString() + 'n';
    return obj;
};

export const bigIntDecode = (obj: unknown) => {
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) return obj.map(bigIntDecode);
        const newObj: {
            [key: string]: unknown;
        } = {};
        for (const key in obj) {
            newObj[key] = bigIntDecode(obj[key]);
        }
        return newObj;
    }
    if (typeof obj === 'string' && obj.endsWith('n')) {
        return BigInt(obj.slice(0, -1));
    }
    return obj;
};
