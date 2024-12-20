export const globalize = (value: unknown, name: string) => {
    Object.assign(window, { [name]: value });
};

export const immutable = <T extends object>(value: T): Readonly<T> => {
    return Object.freeze(value);
};
