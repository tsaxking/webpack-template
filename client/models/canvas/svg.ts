import { copy } from '../../../shared/copy';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Drawable } from './drawable';

export class SVG extends Drawable<SVG> {
    private readonly $img: HTMLImageElement = new Image();
    private $ready = false;
    constructor(
        public readonly src: string,
        public center: Point2D,
    ) {
        super();

        this.$img.src = src;

        this.$img.onload = () => {
            this.$ready = true;

            if (this.$properties?.text?.height) {
                this.$img.height = this.$properties.text.height;
            }

            if (this.$properties?.text?.width) {
                this.$img.width = this.$properties.text.width;
            }
        };
    }

    get x() {
        return this.center[0];
    }

    set x(x: number) {
        this.center[0] = x;
    }

    get y() {
        return this.center[1];
    }

    set y(y: number) {
        this.center[1] = y;
    }

    set color(color: string) {
        if (!this.$properties.text) this.$properties.text = {};
        this.$properties.text!.color = color;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.$ready) return;

        if (this.$properties?.text?.color) {
            ctx.fillStyle = this.$properties.text.color;
        }

        if (this.$properties?.text?.font) {
            console.warn("You can't set the font of an SVG");
        }

        ctx.drawImage(
            this.$img,
            this.center[0] * ctx.canvas.width,
            this.center[1] * ctx.canvas.height,
            this.$img.width,
            this.$img.height,
        );
    }

    clone(): SVG {
        const s = new SVG(this.src, this.center);
        copy(this, s);
        return s;
    }
}
