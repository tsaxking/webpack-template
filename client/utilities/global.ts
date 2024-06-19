export const globalize = (value: unknown, name: string) => {
    eval(`Object.assign(this, { [name]: value });`);
};

export const immutable = <T extends object>(value: T): Readonly<T> => {
    return Object.freeze(value);
};
