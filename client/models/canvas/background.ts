import { copy } from '../../../shared/copy';
import { Color } from '../../submodules/colors/color';
import { Drawable } from './drawable';

export class Background extends Drawable<Background> {
    get color() {
        return Color.parse(this.$properties.fill?.color || 'white');
    }

    set color(value: Color) {
        this.$properties.fill = {
            color: value.toString('rgba'),
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = this.color.toString('rgba');
        ctx.fillRect(0, 0, width, height);
    }

    isIn(_point: [number, number]): boolean {
        return true;
    }

    clone(): Background {
        const b = new Background();
        b.color = this.color;
        copy(this, b);
        return b;
    }
}
