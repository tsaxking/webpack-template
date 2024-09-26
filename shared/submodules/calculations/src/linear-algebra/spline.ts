import { Point } from './point';
import { Vector } from './vector';
import { Point2D } from './point';

// TODO: Add magnitude

export interface SplineInterface {
    ft(t: number): Point;
    generatePoints(count: number): Point[];
}

type SplineOptions = {
    type: 'bezier' | 'catmull-rom';
};

/**
 * A curve defined by a series of points
 * @date 1/10/2024 - 2:41:33 PM
 *
 * @export
 * @class Spline
 * @typedef {Spline}
 */
export class Spline implements SplineInterface {
    /**
     * An array of points defining the spline
     * @date 1/10/2024 - 2:41:33 PM
     *
     * @public
     * @type {Point[]}
     */
    public points: Point[];

    /**
     * Creates an instance of Spline.
     * @date 1/10/2024 - 2:41:33 PM
     *
     * @constructor
     * @param {...Point[]} points
     */
    constructor(
        points: Point[],
        public options?: Partial<SplineOptions>
    ) {
        this.points = points;
    }

    /**
     * Returns the point on the spline at t
     * @param t (between 0 and 1)
     * @returns
     */
    ft(t: number): Point {
        const type = this.options?.type || 'bezier';
        let points: Point[] = this.points.slice();

        const createBezier = (points: Point[], factor: number): Point[] => {
            return new Array(points.length - 1).fill(null).map((_, i) => {
                const p1 = points[i];
                const p2 = points[i + 1];
                const end = p1.interpolate(p2, factor);
                return end;
            });
        };

        const catmulRom = (
            p0: Point,
            p1: Point,
            p2: Point,
            p3: Point,
            t: number
        ) => {
            return (
                0.5 *
                (2 * p1.x +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t)
            );
        };

        const createCatmullRom = (points: Point[], factor: number): Point[] => {
            return new Array(points.length - 1).fill(null).map((_, i) => {
                const p0 = points[i === 0 ? 0 : i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2];
                return new Point(
                    catmulRom(p0, p1, p2, p3, factor),
                    catmulRom(p0, p1, p2, p3, factor)
                );
            });
        };

        while (points.length > 1) {
            if (type === 'bezier') points = createBezier(points, t);
            if (type === 'catmull-rom') points = createCatmullRom(points, t);
        }

        return points[0];
    }

    generatePoints(count: number): Point[] {
        return new Array(count).fill(null).map((_, i) => {
            return this.ft(i / count);
        });
    }
}
