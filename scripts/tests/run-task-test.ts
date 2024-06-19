export const asyncFn = async (...params: unknown[]) => {
    return new Promise<unknown[]>(resolve => {
        resolve(params);
    });
};

export const syncFn = (...params: unknown[]) => {
    return params;
};
