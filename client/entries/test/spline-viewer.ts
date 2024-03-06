import './../../utilities/imports';
import { Canvas } from '../../models/canvas/canvas';
import { Path } from '../../models/canvas/path';
import { Circle } from '../../models/canvas/circle';
import { Point } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Color } from '../../submodules/colors/color';
import { Spline as S } from '../../../shared/submodules/calculations/src/linear-algebra/spline';
import { DrawableEvent } from '../../models/canvas/drawable';
import { Spline } from '../../models/canvas/spline';
import { downloadText } from '../../utilities/downloads';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
document.body.classList.add('bg-dark', 'p-0', 'no-scroll', 'position-relative');

const resetBtn = document.createElement('button');
resetBtn.classList.add(
    'btn',
    'btn-secondary',
    'position-absolute',
    'top-0',
    'start-0',
    'm-2'
);
resetBtn.innerText = 'Reset';
document.body.appendChild(resetBtn);

const downloadBtn = document.createElement('button');
downloadBtn.classList.add(
    'btn',
    'btn-secondary',
    'position-absolute',
    'top-0',
    'end-0',
    'm-2'
);
downloadBtn.innerText = 'Download JSON';
document.body.appendChild(downloadBtn);

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas context is null');

const c = new Canvas(ctx, {
    events: [
        'click',
        'mousedown',
        'mouseup',
        'mousemove',
        'mouseleave',
        'touchstart',
        'touchend',
        'touchmove',
        'touchcancel'
    ]
});

const stop = () => (c.$animating = false);

const spline = new S();

const start = () => {
    c.destroy();

    const paths = {
        y1: new Path([
            [0, 0],
            [0, 1]
        ]),
        'y0.25': new Path([
            [0.25, 0],
            [0.25, 1]
        ]),
        'y0.5': new Path([
            [0.5, 0],
            [0.5, 1]
        ]),
        'y0.75': new Path([
            [0.75, 0],
            [0.75, 1]
        ]),
        y0: new Path([
            [1, 0],
            [1, 1]
        ]),
        x1: new Path([
            [0, 0],
            [1, 0]
        ]),
        'x0.25': new Path([
            [0, 0.25],
            [1, 0.25]
        ]),
        'x0.5': new Path([
            [0, 0.5],
            [1, 0.5]
        ]),
        'x0.75': new Path([
            [0, 0.75],
            [1, 0.75]
        ]),
        x0: new Path([
            [0, 1],
            [1, 1]
        ])
    };

    c.add(
        ...Object.values(paths).map(p => {
            p.$properties.line = {
                color: Color.fromBootstrap('gray').toString('rgba'),
                width: 1
            };
            return p;
        })
    );

    spline.points = new Array(10).fill(0).map((_, i, a) => {
        return new Point(i / a.length, 1 - i / a.length);
    });

    const circles = spline.points.map((_, i, a) => {
        const cir = new Circle([i / a.length, 1 - i / a.length], 0.02);
        cir.$properties.fill = {
            color: Color.fromBootstrap('primary').toString('rgba')
        };

        let dragging = false;
        const start = () => (dragging = true);
        const end = () => (dragging = false);

        const move = (e: DrawableEvent) => {
            if (!dragging) return;
            cir.center = e.points[0];
            spline.points[i].x = e.points[0][0];
            spline.points[i].y = e.points[0][1];
        };

        cir.on('mousedown', start);
        cir.on('touchstart', start);
        cir.on('mouseup', end);
        cir.on('touchend', end);
        cir.on('mousemove', move);
        cir.on('touchmove', move);

        return cir;
    });

    const s = new Spline(spline, {
        frames: 1000
    });

    // spline.magnitude = 5;

    s.$properties.line = {
        color: Color.fromBootstrap('primary').toString('rgba'),
        width: 2
    };

    c.add(...circles, s);

    return c.animate();
};

const reset = () => {
    stop();
    start();
};

resetBtn.onclick = reset;
downloadBtn.onclick = () => {
    downloadText(
        JSON.stringify(
            new Array(1000).fill(0).map((_, i) => spline.ft(i / 1000))
        ),
        'spline.json'
    );
};

start();

const setView = () => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
};

setView();

window.onresize = setView;
