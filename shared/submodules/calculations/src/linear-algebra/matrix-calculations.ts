import { Point, Point2D, Point3D } from './point';
import { Vector } from './vector';
import { Plane } from './plane';

/**
 * A 2d array of numbers
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @typedef {Matrix}
 */
type Matrix = number[][];
/**
 * A 3x3 matrix of numbers
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @typedef {SpatialMatrix}
 */
type SpatialMatrix = [Point3D, Point3D, Point3D];

/**
 * Multiplies two matricies
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @export
 * @param {Matrix} b
 * @returns {{}}
 */
export function multiplyMatricies(a: Matrix, b: Matrix) {
    // ensure that the matricies are compatible
    if (a[0].length !== b.length) {
        throw new Error(
            'Matricies are not compatible, ' +
                'A: ' +
                a.length +
                'x' +
                a[0].length +
                ' B: ' +
                b.length +
                'x' +
                b[0].length +
                ''
        );
    }

    // create the new matrix
    const c: number[][] = [];

    // for each row in a
    for (let i = 0; i < a.length; i++) {
        // create a new row
        c[i] = [];

        // for each column in b
        for (let j = 0; j < b[0].length; j++) {
            // create a new column
            c[i][j] = 0;

            // for each element in the column
            for (let k = 0; k < b.length; k++) {
                // add the product of the elements
                c[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    return c;
}

/**
 * Transforms a point by a matrix
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @export
 * @param {Point3D} point
 * @param {SpatialMatrix} matrix
 * @returns {Point3D}
 */
export function transform(point: Point3D, matrix: SpatialMatrix): Point3D {
    const [x, y, z] = point;
    const [[a], [b], [c]] = multiplyMatricies(matrix, [[x], [y], [z]]);
    return [a, b, c];
}

/**
 * Translates a point by a vector
 * @date 1/10/2024 - 2:37:22 PM
 *
 * @export
 * @param {Point3D} point
 * @param {Point3D} vector
 * @returns {Point3D}
 */
export function translate(point: Point3D, vector: Point3D): Point3D {
    const [x, y, z] = point;
    const [dx, dy, dz] = vector;
    return [x + dx, y + dy, z + dz];
}

/**
 * Scales a point by a vector
 * @date 1/10/2024 - 2:37:52 PM
 *
 * @export
 * @param {Point3D} point
 * @param {Point3D} vector
 * @returns {Point3D}
 */
export function scale(point: Point3D, vector: Point3D): Point3D {
    const [x, y, z] = point;
    const [dx, dy, dz] = vector;
    return [x * dx, y * dy, z * dz];
}

/**
 * Rotates a 2d point by a vector
 * @date 1/10/2024 - 2:38:06 PM
 *
 * @export
 * @param {Point2D} point
 * @param {number} angle
 * @returns {Point2D}
 */
export function rotate2D(point: Point2D, angle: number): Point2D {
    const [x, y] = point;
    return [
        x * Math.cos(angle) - y * Math.sin(angle),
        x * Math.sin(angle) + y * Math.cos(angle)
    ];
}

/**
 * Rotates a 3d point by a vector
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @export
 * @param {Point3D} point
 * @param {Point3D} about
 * @param {Point3D} angle
 * @returns {Point3D}
 */
export function rotate3D(
    point: Point3D,
    about: Point3D,
    angle: Point3D
): Point3D {
    let [x, y, z] = point;
    const [ax, ay, az] = about;
    const [rx, ry, rz] = angle;

    [x, y, z] = translate([x, y, z], [-ax, -ay, -az]);

    [y, z] = rotate2D([y, z], rx);
    [x, z] = rotate2D([x, z], ry);
    [x, y] = rotate2D([x, y], rz);
    [x, y, z] = translate([x, y, z], [ax, ay, az]);

    return [x, y, z];
}

/**
 * Projects a point onto a plane (not tested yet)
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @export
 * @param {Point3D} point
 * @param {number} cameraDistance
 * @param {Vector} viewPlane
 * @param {number} viewAngle
 * @returns {(Point2D | undefined)}
 */
export function perspective(
    point: Point3D,
    cameraDistance: number,
    viewPlane: Vector,
    viewAngle: number
): Point2D | undefined {
    const cameraPoint = new Point(0, 0, -1 * cameraDistance);
    const cameraVector = new Vector(cameraPoint, new Point(...point));

    if (cameraVector.angle(viewPlane) > viewAngle / 2) return;

    const result = viewPlane.plane.intersect(cameraVector)?.array;
    if (!result) return;
    const [x, y] = result;
    return [x, y];
}
