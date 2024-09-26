/**
 * Returns a function that returns the derivative of the given function (the slope of the tangent line at x)
 * @date 1/10/2024 - 2:42:54 PM
 *
 * @export
 * @param {(x: number) => number} fn
 * @param {number} [sigFigs=4]
 * @returns {(x: number) => number}
 */
export function derivative(
    fn: (x: number) => number,
    sigFigs = 4
): (x: number) => number {
    const accuracy = Math.pow(10, -sigFigs);
    return (x: number) => (fn(x + accuracy) - fn(x)) / accuracy;
}

/**
 * Returns a function that returns the integral of the given function (the area under the curve from 0 to x)
 * @date 1/10/2024 - 2:42:54 PM
 *
 * @export
 * @param {(x: number) => number} fn
 * @param {number} [sigFigs=4]
 * @returns {(x: number) => number}
 */
export function integral(
    fn: (x: number) => number,
    sigFigs = 4
): (x: number) => number {
    const accuracy = Math.pow(10, -sigFigs);
    return (x: number) => {
        let sum = 0;
        for (let i = 0; i < x; i += accuracy) {
            sum += fn(i) * accuracy;
        }
        return sum;
    };
}
