import '../../utilities/imports';
import { Canvas } from '../../models/canvas/canvas';
import { Circle } from '../../models/canvas/circle';
import {
    Point,
    Point3D
} from '../../../shared/submodules/calculations/src/linear-algebra/point';
import {
    rotate3D,
    scale,
    translate
} from '../../../shared/submodules/calculations/src/linear-algebra/matrix-calculations';
import { Color } from '../../submodules/colors/color';
import { Spline } from '../../../shared/submodules/calculations/src/linear-algebra/spline';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.classList.add('no-scroll');

const c = new Canvas(canvas.getContext('2d')!);

// c.background.color = Color.fromName('gray');
c.background.properties.fill.color = 'gray';

const cubePoints = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1]
] as Point3D[];
const scaleMatrix = [0.5, 0.5, 0.5] as Point3D;
const translateMatrix = [0.25, 0.25, 0.25] as Point3D;

const circles = cubePoints.map(p => {
    const c = new Circle(p, 0.01);
    c.properties.fill.color = `rgb(${p[0] * 255}, ${p[1] * 255}, ${p[2] * 255})`;
    c.properties.line.color = 'rgba(0, 0, 0, 0)';
    c.center = scale(c.center as Point3D, scaleMatrix);
    c.center = translate(c.center as Point3D, translateMatrix);
    return c;
});

c.add(...circles);

const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
];

const spline = new Spline([
    new Point(...translate(scale([0, 0, 0], scaleMatrix), translateMatrix)),
    new Point(...translate(scale([1, 0.5, 0], scaleMatrix), translateMatrix)),
    new Point(...translate(scale([1, 0.5, 0], scaleMatrix), translateMatrix)),
    new Point(...translate(scale([1, 0.5, 0], scaleMatrix), translateMatrix)),
    new Point(
        ...translate(scale([0.75, 0.25, 0.75], scaleMatrix), translateMatrix)
    ),
    new Point(...translate(scale([0, 1, 0], scaleMatrix), translateMatrix))
]);

const splinePoints = spline.generatePoints(100);

const rotateMatrix = [0.006, 0.005, 0.005] as Point3D;

c.animate(() => {
    for (const c of circles) {
        c.center = rotate3D(c.center as Point3D, [0.5, 0.5, 0.5], rotateMatrix);
    }

    for (const [p1, p2] of edges) {
        c.ctx.save();

        const fromColor = new Color(
            ...(circles[p1].center as Point3D)
        ).toString('rgba');
        const toColor = new Color(...(circles[p2].center as Point3D)).toString(
            'rgba'
        );

        // linear fade
        const gradient = c.ctx.createLinearGradient(
            circles[p1].x * c.ctx.canvas.width,
            circles[p1].y * c.ctx.canvas.height,
            circles[p2].x * c.ctx.canvas.width,
            circles[p2].y * c.ctx.canvas.height
        );

        gradient.addColorStop(0, fromColor);
        gradient.addColorStop(1, toColor);

        c.ctx.strokeStyle = gradient;

        c.ctx.beginPath();
        c.ctx.moveTo(
            circles[p1].x * c.ctx.canvas.width,
            circles[p1].y * c.ctx.canvas.height
        );
        c.ctx.lineTo(
            circles[p2].x * c.ctx.canvas.width,
            circles[p2].y * c.ctx.canvas.height
        );
        c.ctx.stroke();
        c.ctx.restore();
    }

    for (const p of splinePoints) {
        const a = rotate3D(p.array as Point3D, [0.5, 0.5, 0.5], rotateMatrix);
        p.x = a[0];
        p.y = a[1];
        p.z = a[2];
        const color = new Color(
            ...(p.array.map(n => n * 255) as Point3D)
        ).toString('rgba');

        c.ctx.fillStyle = color;
        c.ctx.beginPath();
        c.ctx.arc(
            p.x * c.ctx.canvas.width,
            p.y * c.ctx.canvas.height,
            5,
            0,
            2 * Math.PI
        );
        c.ctx.fill();
    }
});

// c.draw();

Object.assign(window, { c });
