import { Point } from './linear-algebra/point';
import { SplineInterface } from './linear-algebra/spline';

/**
 * Options for drawing a point onto a canvas
 * @date 1/10/2024 - 2:43:32 PM
 *
 * @export
 * @typedef {DrawPointOptions}
 */
export type DrawPointOptions = {
    width?: number;
    height?: number;
    round?: boolean;
    strokeStyle?: string;
    fillStyle?: string;

    transform?: (point: Point) => Point;
};

export const drawPoint = (
    ctx: CanvasRenderingContext2D,
    point: Point,
    options?: DrawPointOptions
) => {
    let p = new Point(...point.array);

    let width = 1;
    let height = 1;
    let round = false;
    let strokeStyle = 'black';
    let fillStyle = 'black';

    ctx.save();
    if (options) {
        if (options.transform) {
            p = options.transform(point);
        }

        width = options.width || width;
        height = options.height || height;
        round = options.round || round;
        strokeStyle = options.strokeStyle || strokeStyle;
        fillStyle = options.fillStyle || fillStyle;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;

    if (round) {
        ctx.beginPath();
        ctx.arc(
            p.x * ctx.canvas.height,
            p.y * ctx.canvas.height,
            width,
            0,
            2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(
            p.x * ctx.canvas.height - width / 2,
            p.y * ctx.canvas.height - height / 2,
            width,
            height
        );
    }
    ctx.restore();
};

/**
 * Generates rgb values from a normalized point
 * @date 1/10/2024 - 2:43:32 PM
 */
export const colorFromPos = (point: Point): [number, number, number] => {
    const [x, y, z] = point.array;
    const r = x * 255;
    const g = y * 255;
    const b = z * 255;

    return [r, g, b];
};

export type DrawEdgeOptions = {
    gradient?: boolean;
    strokeStyle?: string;
    lineWidth?: number;
    transform?: (point: Point) => Point;
};

export const drawEdge = (
    ctx: CanvasRenderingContext2D,
    [p1, p2]: [Point, Point],
    options: DrawEdgeOptions
) => {
    let p1t = p1;
    let p2t = p2;
    const lineWidth = 1;
    let strokeStyle: string | CanvasGradient = 'black';

    if (options) {
        if (options.transform) {
            p1t = options.transform(p1);
            p2t = options.transform(p2);
        }

        if (options.gradient) {
            const g = ctx.createLinearGradient(
                p1t.x * ctx.canvas.height,
                p1t.y * ctx.canvas.height,
                p2t.x * ctx.canvas.height,
                p2t.y * ctx.canvas.height
            );

            g.addColorStop(0, colorToString(colorFromPos(p1)));
            g.addColorStop(1, colorToString(colorFromPos(p2)));

            strokeStyle = g;
        }
    }

    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1t.x * ctx.canvas.height, p1t.y * ctx.canvas.height);
    ctx.lineTo(p2t.x * ctx.canvas.height, p2t.y * ctx.canvas.height);
    ctx.stroke();
    ctx.restore();
};

export const clear = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawSpline = (
    ctx: CanvasRenderingContext2D,
    spline: SplineInterface,
    steps: number,
    options?: (p: Point) => DrawPointOptions
) => {
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        // console.log(t);
        const point = spline.ft(t);
        drawPoint(ctx, point, options ? options(point) : undefined);
    }
};

/**
 * Converts rgb values to a string
 * @date 1/10/2024 - 2:43:31 PM
 */
export const colorToString = (color: [number, number, number]): string => {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};

/**
 * Converts degrees to radians
 * @date 1/10/2024 - 2:43:31 PM
 */
export const toRadians = (degrees: number): number => {
    return (degrees * Math.PI) / 180;
};

/**
 * Converts radians to degrees
 * @date 1/10/2024 - 2:43:31 PM
 */
export const toDegrees = (radians: number): number => {
    return (radians * 180) / Math.PI;
};
