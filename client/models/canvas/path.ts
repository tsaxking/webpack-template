import { Drawable } from './drawable';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { copy } from '../../../shared/copy';

export class Path extends Drawable<Path> {
    constructor(public points: Point2D[]) {
        super();
    }

    /**
     * Draw the path
     * @date 1/9/2024 - 11:55:50 AM
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        if (!this.points[0]) return;
        ctx.moveTo(
            this.points[0][0] * ctx.canvas.width,
            this.points[0][1] * ctx.canvas.height,
        );
        if (this.$properties?.line?.color) {
            ctx.strokeStyle = this.$properties.line?.color;
        }
        if (this.$properties?.line?.width) {
            ctx.lineWidth = this.$properties.line?.width;
        }
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(
                this.points[i][0] * ctx.canvas.width,
                this.points[i][1] * ctx.canvas.height,
            );
        }
        ctx.stroke();
    }

    add(...points: Point2D[]) {
        this.points.push(...points);
    }

    isIn(point: Point2D) {
        return this.points.some((p) => p[0] === point[0] && p[1] === point[1]);
    }

    clone(): Path {
        const p = new Path(this.points.map((p) => [...p]));
        copy(this, p);
        return p;
    }
}
