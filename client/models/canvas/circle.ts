import { Drawable } from './drawable';
import {
    Point2D,
    Point3D,
} from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { copy } from '../../../shared/copy';

export class Circle extends Drawable<Circle> {
    /**
     * Creates an instance of Circle.
     * @date 1/9/2024 - 11:47:29 AM
     *
     * @constructor
     * @param {Point2D} center [x, y] normalized coordinates
     * @param {number} radius normalized radius of the circle to the height of the canvas
     */
    constructor(
        public center: Point2D | Point3D,
        public radius: number,
    ) {
        super();
    }

    /**
     * If the given point is inside the circle
     * @date 1/9/2024 - 11:47:29 AM
     *
     * @param {Point2D} point
     * @returns {boolean}
     */
    public isIn(point: Point2D) {
        const [px, py] = point;
        const [x, y] = this.reflect(this.center);
        return (
            Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2)) < this.radius
        );
    }

    /**
     * Draw the circle
     * @date 1/9/2024 - 11:47:29 AM
     *
     * @param {CanvasRenderingContext2D} context
     */
    public draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        if (this.$properties?.line?.color) {
            context.strokeStyle = this.$properties.line.color;
        }
        if (this.$properties?.line?.width) {
            context.lineWidth = this.$properties.line.width;
        }
        if (this.$properties?.fill?.color) {
            context.fillStyle = this.$properties.fill.color;
        }
        // console.log(this.center);
        const [x, y] = this.reflect(this.center);
        context.arc(
            x * context.canvas.width,
            y * context.canvas.height,
            this.radius * context.canvas.height,
            0,
            2 * Math.PI,
        );
        if (this.$properties?.fill) context.fill();
        if (this.$properties.line) context.stroke();
    }

    /**
     * Returns the x coordinate of the center
     * @date 1/9/2024 - 11:47:29 AM
     *
     * @readonly
     * @type {Point2D}
     */
    get x() {
        return this.center[0];
    }

    /**
     * Returns the x coordinate of the center
     */
    set x(x: number) {
        this.center[0] = x;
    }

    /**
     * Returns the y coordinate of the center
     * @date 1/9/2024 - 11:47:29 AM
     *
     * @readonly
     * @type {Point2D}
     */
    get y() {
        return this.center[1];
    }

    /**
     * Returns the y coordinate of the center
     */
    set y(y: number) {
        this.center[1] = y;
    }

    clone(): Circle {
        const c = new Circle(this.center, this.radius);
        copy(c, this);
        return c;
    }

    // public get $Math() {
    //     return {
    //         center: new Point(this.center[0], this.center[1])
    //     }
    // }
}
