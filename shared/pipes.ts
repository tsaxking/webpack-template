/**
 * Function in pipe
 * @date 3/8/2024 - 6:42:35 AM
 *
 * @typedef {Fn}
 * @template [X=unknown]
 */
type Fn<X = unknown> = (x: X) => X;

/**
 * Used to pipe several functions together
 * @date 3/8/2024 - 6:42:35 AM
 *
 * @template [X=unknown]
 * @param {X[]} arr
 * @param {...Fn<X>[]} fns
 * @returns {X[]}
 */
export const pipe = <X = unknown>(arr: X[], ...fns: Fn<X>[]): X[] =>
    fns.reduce((acc, fn) => acc.map(fn), arr);
