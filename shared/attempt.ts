/**
 * Surrounds a function with a try/catch block and returns the result of the function or null if an error is thrown
 * @date 1/9/2024 - 12:05:02 PM
 */
export const attempt = <T = any>(fn: (...params: any[]) => T, ...params: any[]): T | null => {
    try {
        return fn(...params);
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * Surrounds an async function with a try/catch block and returns the result of the function or null if an error is thrown
 * @date 1/9/2024 - 12:05:02 PM
 *
 * @async
 */
export const attemptAsync = async <T = any>(fn: (...params: any[]) => Promise<T>, ...params: any[]): Promise<T | null> => {
    try {
        return await fn(...params);
    } catch (e) {
        console.error(e);
        return null;
    }
}