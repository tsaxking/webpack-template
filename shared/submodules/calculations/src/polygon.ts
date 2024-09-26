import { Point2D } from './linear-algebra/point';

/**
 * Uses the ray-casting algorithm to test if a point is inside a polygon
 * @date 1/10/2024 - 2:45:25 PM
 */
export const isInside = (point: Point2D, points: Point2D[]) => {
    // using ray-casting algorithm
    // test if a point is inside a polygon

    // points is an array of [x, y] points

    const [x, y] = point;

    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];

        const intersect =
            yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
};
