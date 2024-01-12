/**
 * generates a pseudorandom string
 * @date 10/12/2023 - 2:45:26 PM
 */
export const uuid = (options?: {
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




/**
 * Chooses a random element from an array
 * @date 1/11/2024 - 7:11:15 PM
 */
export const choose = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];




/**
 * Returns a shuffled version of the array
 * @date 1/11/2024 - 7:11:15 PM
 */
export const shuffle = <T>(array: T[]): T[] => {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        const index = Math.floor(Math.random() * array.length);
        result.push(array[index]);
        array.splice(index, 1);
    }
    return result;
}