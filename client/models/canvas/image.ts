import { Drawable } from './drawable';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { copy } from '../../../shared/copy';

/**
 * Location and size of the image
 * @date 1/9/2024 - 11:48:39 AM
 *
 * @typedef {CanvasImgOptions}
 */
export type CanvasImgOptions = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class Img extends Drawable<Img> {
    /**
     * Description placeholder
     * @date 1/9/2024 - 11:48:39 AM
     *
     * @public
     * @readonly
     * @type {HTMLImageElement}
     */
    public readonly img: HTMLImageElement = new Image();
    private data: HTMLImageElement | null = null;

    constructor(
        public readonly src: string,
        public readonly options: Partial<CanvasImgOptions> = {},
    ) {
        super();

        this.img.src = src;

        this.img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = this.img.width;
            canvas.height = this.img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (this.properties?.mirror) {
                const { x, y } = this.properties.mirror;
                if (x) {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }

                if (y) {
                    ctx.translate(0, canvas.height);
                    ctx.scale(1, -1);
                }
            }

            ctx.drawImage(this.img, 0, 0);
            // to data url
            const i = document.createElement('img');
            i.src = canvas.toDataURL();
            this.data = i;
        };
    }

    /**
     * X coordinate of the image (left side)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    get x() {
        return this.options.x ?? 0;
    }

    /**
     * X coordinate of the image (left side)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    set x(x: number) {
        this.options.x = x;
    }

    /**
     * Y coordinate of the image (top side)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    get y() {
        return this.options.y ?? 0;
    }

    /**
     * Y coordinate of the image (top side)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    set y(y: number) {
        this.options.y = y;
    }

    /**
     * Width of the image (0 - 1)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    get width() {
        return this.options.width ?? this.img.width;
    }

    /**
     * Width of the image (0 - 1)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    set width(width: number) {
        this.options.width = width;
    }

    /**
     * Height of the image (0 - 1)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    get height() {
        return this.options.height ?? this.img.height;
    }

    /**
     * Height of the image (0 - 1)
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @type {number}
     */
    set height(height: number) {
        this.options.height = height;
    }

    /**
     * Draw the image
     * @date 1/9/2024 - 11:48:39 AM
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.options;
        if (!this.data) return;

        ctx.drawImage(
            this.data,
            (x || 0) * ctx.canvas.width,
            (y || 0) * ctx.canvas.height,
            (width || 0) * ctx.canvas.width,
            (height || 0) * ctx.canvas.height,
        );
    }

    /**
     * Determines if the given point is inside the image
     * @date 1/9/2024 - 11:50:23 AM
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isIn(point: Point2D) {
        const [px, py] = point;

        const [x, y] = this.reflect([this.x, this.y]);

        return (
            px >= x && px <= x + this.width && py >= y && py <= y + this.height
        );
    }

    clone(): Img {
        const i = new Img(this.src, this.options);
        copy(this, i);
        return i;
    }
}
