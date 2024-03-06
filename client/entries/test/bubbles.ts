import '../../utilities/imports';
import { Canvas } from '../../models/canvas/canvas';
import { Circle } from '../../models/canvas/circle';
import { Random } from '../../../shared/math';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.classList.add('no-scroll');

const c = new Canvas(canvas.getContext('2d')!);

class Bubble extends Circle {
    constructor(
        center: [number, number],
        radius: number,
        public velocity: [number, number]
    ) {
        super(center, radius);
        this.properties.fill.color = 'rgba(255, 255, 255, 0.5)';
        this.properties.line.color = 'rgba(255, 255, 255, 0)';
    }
}

const { sin, PI, cos, random } = Math;

const bubbles = Array.from({ length: 100 }).map(_ => {
    return new Bubble([random(), random()], Random.between(0.01, 0.05), [
        Random.between(-0.01, 0.01),
        Random.between(-0.01, 0.01)
    ]);
});

c.add(...bubbles);

c.animate(() => {
    for (const b of bubbles) {
        b.center = [
            (b.center[0] + b.velocity[0]) % 1,
            (b.center[1] + b.velocity[1]) % 1
        ];
    }
});
