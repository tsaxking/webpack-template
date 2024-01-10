export const asyncFn = async (...params: any[]) => {
    return new Promise<any[]>((resolve, reject) => {
        resolve(params);
    });
};

export const syncFn = (...params: any[]) => {
    return params;
};
