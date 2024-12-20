import '../../utilities/imports';

import { Canvas } from '../../models/canvas/canvas';
import { Surface } from '../../models/canvas/surface';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.classList.add('no-scroll');

const c = new Canvas(canvas.getContext('2d')!);

const { sin, PI, cos } = Math;

const s = new Surface((x, y) => cos(PI * x) * sin(PI * y), 100, [
    [0.5, 0.4, 0.5],
    [0.7, 1, 0.9],
    [0.6, 0.2, 0.1]
]);

console.log(s.triangles);

c.add(s);

c.draw();
