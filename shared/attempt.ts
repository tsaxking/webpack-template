export const attempt = <T = any>(fn: (...params: any[]) => T, ...params: any[]): T | null => {
    try {
        return fn(...params);
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const attemptAsync = async <T = any>(fn: (...params: any[]) => Promise<T>, ...params: any[]): Promise<T | null> => {
    try {
        return await fn(...params);
    } catch (e) {
        console.error(e);
        return null;
    }
}
