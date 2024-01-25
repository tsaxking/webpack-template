import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Polygon } from './polygon';

export class Border extends Polygon {
    isIn(point: Point2D) {
        return !super.isIn(point);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const region = new Path2D();

        region.moveTo(
            this.points[0][0] * ctx.canvas.width,
            this.points[0][1] * ctx.canvas.height,
        );

        for (let i = 1; i < this.points.length; i++) {
            region.lineTo(
                this.points[i][0] * ctx.canvas.width,
                this.points[i][1] * ctx.canvas.height,
            );
        }
        region.closePath();

        region.moveTo(0, 0);
        region.lineTo(ctx.canvas.width, 0);
        region.lineTo(ctx.canvas.width, ctx.canvas.height);
        region.lineTo(0, ctx.canvas.height);
        region.closePath();

        // fill the area between the polygon and the canvas edges
        if (this.$properties?.fill?.color) {
            ctx.fillStyle = this.$properties.fill.color;
        }
        if (this.$properties?.fill) ctx.fill(region, 'evenodd');
    }
}
