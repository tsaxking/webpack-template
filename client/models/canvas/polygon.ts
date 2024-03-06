import { Drawable } from './drawable';
import {
    Point2D,
    Point3D
} from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { copy } from '../../../shared/copy';

/**
 * Polygon
 * @date 1/25/2024 - 12:36:59 PM
 *
 * @export
 * @class Polygon
 * @typedef {Polygon}
 * @extends {Drawable<Polygon>}
 */
export class Polygon extends Drawable<Polygon> {
    /**
     * Creates an instance of Polygon.
     * @date 1/25/2024 - 12:36:59 PM
     *
     * @constructor
     * @param {Point2D[]} points
     * @param {Partial<ShapeProperties<Polygon>>} [$properties={}]
     */
    constructor(public points: (Point2D | Point3D)[]) {
        // it doesn't matter, because we only pull the first 2 values
        super();
    }

    /**
     * Draw the polygon
     * @date 1/25/2024 - 12:36:59 PM
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const points = this.points.map(p => this.reflect(p));
        if (!points[0]) return;

        const x0 = points[0][0] * ctx.canvas.width;
        const y0 = points[0][1] * ctx.canvas.height;
        ctx.moveTo(x0, y0);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(
                points[i][0] * ctx.canvas.width,
                points[i][1] * ctx.canvas.height
            );
        }
        ctx.closePath();

        if (this.$properties?.line?.color) {
            ctx.strokeStyle = this.$properties.line.color;
        }
        if (this.$properties?.line?.width) {
            ctx.lineWidth = this.$properties.line.width;
        }

        if (this.$properties?.line) ctx.stroke();

        if (this.$properties?.fill?.color) {
            ctx.fillStyle = this.$properties.fill.color;
        }
        if (this.$properties?.fill) ctx.fill();
    }

    /**
     * Check if the given point is inside the polygon
     * @date 1/25/2024 - 12:36:59 PM
     *
     * @param {Point2D} point
     * @returns {boolean}
     */
    isIn(point: Point2D | Point3D) {
        const [x, y] = point;
        let inside = false;

        const points = this.points.map(p => this.reflect(p));

        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i][0],
                yi = points[i][1];
            const xj = points[j][0],
                yj = points[j][1];

            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }

        return inside;
    }

    clone(): Polygon {
        const p = new Polygon(this.points.map(p => [...p]));
        copy(this, p);
        return p;
    }
}
