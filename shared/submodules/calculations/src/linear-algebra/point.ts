/**
 * A point in 2d space
 * @date 1/10/2024 - 2:39:28 PM
 *
 * @export
 * @typedef {Point2D}
 */
export type Point2D = [number, number];
/**
 * A point in 3d space
 * @date 1/10/2024 - 2:39:28 PM
 *
 * @export
 * @typedef {Point3D}
 */
export type Point3D = [number, number, number];

export class Point {
    /**
     * Generates a random point in 3d space
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @static
     * @returns {Point}
     */
    static random() {
        return new Point(Math.random(), Math.random(), Math.random());
    }

    /**
     * Creates an instance of Point.
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} [z=0]
     */
    constructor(
        public x: number,
        public y: number,
        public z: number = 0
    ) {}

    /**
     * Returns the point as an array of [x, y, z]
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @readonly
     * @type {Point3D}
     */
    get array(): Point3D {
        return [this.x, this.y, this.z];
    }

    /**
     * returns a new point translated by the given vector represented as a Point object
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @param {Point} vector
     * @returns {Point}
     */
    add(vector: Point): Point {
        return new Point(
            this.x + vector.x,
            this.y + vector.y,
            this.z + vector.z
        );
    }

    /**
     * returns a new point scaled by the given vector
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @param {number} scale
     * @returns {Point}
     */
    scale(scale: number): Point {
        return new Point(this.x * scale, this.y * scale, this.z * scale);
    }

    /**
     * Returns the distance between this point and the given point
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @param {Point} point
     * @returns {number}
     */
    distance(point: Point): number {
        return Math.sqrt(
            Math.pow(this.x - point.x, 2) +
                Math.pow(this.y - point.y, 2) +
                Math.pow(this.z - point.z, 2)
        );
    }

    /**
     * Returns a point that is ratio% between this point and the given point
     * @date 1/10/2024 - 2:39:28 PM
     *
     * @param {Point} point
     * @param {number} ratio
     * @returns {Point}
     */
    interpolate(point: Point, ratio: number): Point {
        // return a point that is ratio% between this point and the given point
        return new Point(
            this.x + (point.x - this.x) * ratio,
            this.y + (point.y - this.y) * ratio,
            this.z + (point.z - this.z) * ratio
        );
    }
}
