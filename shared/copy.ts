/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Copy the properties of an object to another object without changing the reference
 * @date 3/8/2024 - 6:39:47 AM
 *
 * @param {*} from
 * @param {*} to
 * @returns {*}
 */
export const copy = (from: any, to: any) => {
    Object.assign(to, copyNoRef(from));
    return to;
};

export const copyWithPrototype = (obj: any) => {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), copyNoRef(obj));
}

export const copyNoRef = <T = unknown>(obj: any) => JSON.parse(JSON.stringify(obj)) as T;