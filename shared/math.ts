/**
 * Random operations
 * @date 1/13/2024 - 11:32:15 PM
 *
 * @export
 * @class Random
 * @typedef {Random}
 */
export class Random {
    /**
     * Returns a random uuid string
     * @date 1/13/2024 - 11:32:15 PM
     *
     * @param {?{
     *         length?: number;
     *         charset?: string;
     *     }} [options]
     * @returns {string}
     */
    static uuid(options?: { length?: number; charset?: string }) {
        const length = options?.length ?? 16;
        const charset = options?.charset ??
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(
                Math.floor(Math.random() * charset.length),
            );
        }

        return result;
    }

    /**
     * Chooses a random element from the given array
     * @date 1/13/2024 - 11:32:15 PM
     *
     * @template T
     * @param {T[]} array
     * @returns {T}
     */
    static choose<T extends never>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Shuffles the given array
     * @date 1/13/2024 - 11:32:15 PM
     *
     * @template T
     * @param {T[]} array
     * @returns {T[]}
     */
    static shuffle<T extends never>(array: T[]): T[] {
        const result = [];
        for (let i = 0; i < array.length; i++) {
            const index = Math.floor(Math.random() * array.length);
            result.push(array[index]);
            array.splice(index, 1);
        }
        return result;
    }

    /**
     * Returns a random number between the given min and max
     * @date 1/13/2024 - 11:32:15 PM
     *
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static between(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

/**
 * Extending Math operations
 * @date 1/15/2024 - 10:44:13 PM
 *
 * @export
 * @class
 * @typedef {$Math}
 */
export class $Math {
    /**
     * Returns a random number to the given number of significant figures
     * @date 1/13/2024 - 11:32:15 PM
     *
     * @param {number} sigFigs
     * @param {number} num
     * @returns {number}
     */
    static roundTo(sigFigs: number, num: number): number {
        const mult = Math.pow(10, sigFigs);
        return Math.round(num * mult) / mult;
    }
}
