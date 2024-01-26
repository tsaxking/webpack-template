import { copy } from '../../../shared/copy';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Drawable } from './drawable';
import { MaterialIcon } from 'material-icons';

const { ceil } = Math;

type TextOptions = {
    color: string;
    size: number;
    x: number;
    y: number;
};

export class Icon extends Drawable<MaterialIcon> {
    constructor(
        public readonly icon: MaterialIcon,
        public readonly options: Partial<TextOptions> = {},
    ) {
        super();
    }

    get x() {
        return this.options.x ?? 0;
    }

    set x(x: number) {
        this.options.x = x;
    }

    get y() {
        return this.options.y ?? 0;
    }

    set y(y: number) {
        this.options.y = y;
    }

    get size() {
        return this.options.size ?? 0.01;
    }

    set size(size: number) {
        this.options.size = size;
    }

    get color() {
        return this.options.color ?? 'black';
    }

    set color(color: string) {
        this.options.color = color;
    }

    draw(ctx: CanvasRenderingContext2D) {
        let { x, y, size } = this;

        const { color } = this;

        size = size * ctx.canvas.height;
        x = x * ctx.canvas.width - size / 2;
        y = y * ctx.canvas.height + size / 2;

        ctx.font = `${ceil(size)}px Material Icons`;
        ctx.fillStyle = color;
        ctx.fillText(this.icon, x, y);
    }

    isIn(point: Point2D) {
        const { x, y, size } = this;

        const s = size / 2;

        const [px, py] = point;

        return px >= x - s && px <= x + s && py >= y - s && py <= y + s;
    }

    clone(): Icon {
        const i = new Icon(this.icon, this.options);
        copy(this, i);
        return i;
    }
}
