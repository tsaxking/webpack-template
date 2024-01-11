/**
 * generates a pseudorandom string
 * @date 10/12/2023 - 2:45:26 PM
 */
export const random = (options?: {
    length?: number;
    charset?: string;
}) => {
    const length = options?.length ?? 16;
    const charset = options?.charset ??
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return result;
};
