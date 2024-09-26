import { Point } from './point';
import { Vector } from './vector';

/**
 * A plane in 3d space, defined by a vector normal to the plane
 * @date 1/10/2024 - 2:38:46 PM
 *
 * @export
 * @class Plane
 * @typedef {Plane}
 */
export class Plane {
    /**
     *  Creates a plane from three points
     * @date 1/10/2024 - 2:38:45 PM
     *
     * @static
     * @param {Point} p1
     * @param {Point} p2
     * @param {Point} p3
     * @returns {Plane}
     */
    static from(p1: Point, p2: Point, p3: Point): Plane {
        const v1 = new Vector(p1, p2);
        const v2 = new Vector(p1, p3);
        const normal = v1.cross(v2);
        return new Plane(normal);
    }

    /**
     * Creates an instance of Plane.
     * @date 1/10/2024 - 2:38:45 PM
     *
     * @constructor
     * @param {Vector} normal
     */
    constructor(public normal: Vector) {}

    /**
     * Returns the point of intersection between the plane and a vector, or null if the vector is parallel to the plane
     * @date 1/10/2024 - 2:38:45 PM
     *
     * @param {Vector} v
     * @returns {(Point | null)}
     */
    intersect(v: Vector): Point | null {
        const t =
            this.normal.dot(new Vector(this.normal.point, v.point)) /
            this.normal.dot(v);
        if (t < 0) return null;
        const x = v.ft('x')(t);
        const y = v.ft('y')(t);
        const z = v.ft('z')(t);
        return x === v.rate.x && y === v.rate.y && z === v.rate.z
            ? new Point(x, y, z)
            : null;
    }
}
