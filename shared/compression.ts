import { attempt } from './check';

const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:"<>?`~[]\';./=\\,';

export const compress = (num: number) => {
    return attempt(() => {
        if (Math.floor(num) !== num) {
            throw new Error('Number must be an integer');
        }
        const base = chars.length;
        let result = '';
        while (num > 0) {
            result = chars[num % base] + result;
            num = Math.floor(num / base);
        }
        return result;
    });
};

export const decompress = (str: string) => {
    return attempt(() => {
        const base = chars.length;
        let num = 0;
        for (let i = 0; i < str.length; i++) {
            num += chars.indexOf(str[i]) * Math.pow(base, str.length - i - 1);
        }
        str = num.toString();

        return parseInt(str);
    });
};
