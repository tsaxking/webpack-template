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
        const charset =
            options?.charset ??
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(
                Math.floor(Math.random() * charset.length)
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
    static choose<T = never>(array: T[]): T {
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
    static shuffle<T = never>(array: T[]): T[] {
        const result: T[] = [];
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

    /**
     * Returns a function to be used in an array.map() call to calculate the moving average given a window
     * @date 1/18/2024 - 1:55:32 AM
     *
     * @static
     * @param {number} window
     * @returns {(value: number, index: number, array: {}) => number}
     */
    static movingAverage(
        window: number
    ): (value: number, index: number, array: number[]) => number {
        if (window < 1) throw new Error('Window must be greater than 0');
        if (Math.round(window) !== window) {
            throw new Error('Window must be an integer');
        }
        return (value: number, index: number, array: number[]): number => {
            if (index === 1) return value; // not enough data yet
            if (index < window) return $Math.average(array.slice(0, index)); // average available data
            return $Math.average(array.slice(index - window, index)); // average window
        };
    }

    /**
     * Returns the average of the given array
     * @date 1/18/2024 - 1:55:32 AM
     *
     * @static
     * @param {number[]} array
     * @returns {number}
     */
    static average(array: number[]): number {
        return array.reduce((a, b) => a + b) / array.length;
    }
}
