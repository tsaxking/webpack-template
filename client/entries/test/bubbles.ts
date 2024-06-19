import '../../utilities/imports';
import { Canvas } from '../../models/canvas/canvas';
import { Circle } from '../../models/canvas/circle';
import { Random } from '../../../shared/math';
import { globalize } from '../../utilities/global';
import { Color } from '../../submodules/colors/color';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.classList.add('no-scroll');

const c = new Canvas(canvas.getContext('2d')!);
c.adaptable = true;

class Bubble extends Circle {
    constructor(
        center: [number, number],
        radius: number,
        public velocity: [number, number]
    ) {
        super(center, radius);
        const c = Color.random();
        this.properties.fill.color = c.toString('rgba');
        this.properties.line.color = c.toString('rgba');
    }
}

const { sin, PI, cos, random } = Math;

const bubbles = Array.from({ length: 100 }).map(_ => {
    return new Bubble([random(), random()], Random.between(1, 5), [
        Random.between(-100, 100) / 100,
        Random.between(-100, 100) / 100
    ]);
});

c.add(...bubbles);

c.animate(() => {
    // console.log('animate');
    for (const b of bubbles) {
        if (b.center[0] < 0 || b.center[0] > 1) {
            b.velocity[0] *= -1;
        }

        if (b.center[1] < 0 || b.center[1] > 1) {
            b.velocity[1] *= -1;
        }

        b.center[0] += b.velocity[0];
        b.center[1] += b.velocity[1];
    }
});

globalize(c, 'canvas');
