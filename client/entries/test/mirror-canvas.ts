import '../../utilities/imports';
import { Canvas } from '../../models/canvas/canvas';
import { Circle } from '../../models/canvas/circle';

const c = document.createElement('canvas');
document.body.appendChild(c);
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.width = '100vw';
document.body.style.height = '100vh';
const ctx = c.getContext('2d');
if (!ctx) throw new Error('Could not get canvas context');

const canvas = new Canvas(ctx, {
    events: ['click'],
});
canvas.adaptable = true;
canvas.ratio = 2;

const circle = new Circle([0.25, 0.25], 0.05);
circle.fill.color = 'red';

// circle.mirror.x = true;
// circle.mirror.y = true;

circle.on('click', console.log);

canvas.add(circle);

canvas.animate();
