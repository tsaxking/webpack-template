import { Drawable } from './drawable';
import { EventEmitter } from '../../../shared/event-emitter';
import { attempt } from '../../../shared/attempt';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { DrawableEvent } from './drawable';

/**
 * Description placeholder
 * @date 1/25/2024 - 12:50:19 PM
 *
 * @typedef {CanvasEvents}
 */
type CanvasEvents = {
    animatestart: void;
    animateend: void;
    draw: void;
    click: DrawableEvent;
    touchstart: DrawableEvent;
    touchmove: DrawableEvent;
    touchend: DrawableEvent;
    touchcancel: DrawableEvent;
    mousemove: DrawableEvent;
    mousedown: DrawableEvent;
    mouseup: DrawableEvent;
    mouseover: DrawableEvent;
    mouseleave: DrawableEvent;
    mouseenter: DrawableEvent;
};

/**
 * Options for the canvas
 * @date 1/25/2024 - 12:50:19 PM
 *
 * @typedef {CanvasOptions}
 */
type CanvasOptions = {
    /**
     * All events that the canvas should listen for (this will be deduped)
     * @date 1/25/2024 - 12:51:53 PM
     *
     * @type {(keyof CanvasEvents)[]}
     */
    events: (keyof CanvasEvents)[];
};

/**
 * A class to manage the canvas and drawables
 * @date 1/25/2024 - 12:50:19 PM
 *
 * @export
 * @class Canvas
 * @typedef {Canvas}
 */
export class Canvas {
    /**
     * All drawables on the canvas
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @readonly
     * @type {Drawable[]}
     */
    public readonly $drawables: Drawable[] = [];
    /**
     * Emitter for canvas events
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public readonly $emitter = new EventEmitter<keyof CanvasEvents>();
    /**
     * Animation status
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @type {boolean}
     */
    public $animating = false;
    /**
     * Frames per second (default 60)
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @type {number}
     */
    public $fps = 60;
    /**
     * Canvas element
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @readonly
     * @type {HTMLCanvasElement}
     */
    public readonly $canvas: HTMLCanvasElement;
    /**
     * Canvas context
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @readonly
     * @type {CanvasRenderingContext2D}
     */
    public readonly $ctx: CanvasRenderingContext2D;
    /**
     * Options for the canvas
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @public
     * @readonly
     * @type {Partial<CanvasOptions>}
     */
    public readonly $options: Partial<CanvasOptions>;

    /**
     * Creates an instance of Canvas.
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @constructor
     * @param {CanvasRenderingContext2D} ctx
     * @param {Partial<CanvasOptions>} [options={}]
     */
    constructor(
        ctx: CanvasRenderingContext2D,
        options: Partial<CanvasOptions> = {},
    ) {
        this.$canvas = ctx.canvas;
        this.$ctx = ctx;
        this.$options = options;

        if (this.$options.events) {
            this.$options.events = this.$options.events.filter(
                (e, i, a) => a.indexOf(e) === i,
            );
            for (const event of this.$options.events) {
                switch (event) {
                    case 'click':
                        this.$canvas.addEventListener('click', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('click', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('click', e);
                                }
                            }
                        });
                        break;
                    case 'touchstart':
                        this.$canvas.addEventListener('touchstart', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('touchstart', e);
                            const points = this.getXY(event);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some((point) => drawable.isIn(point))
                                ) {
                                    drawable.emit('touchstart', e);
                                }
                            }
                        });
                        break;
                    case 'touchmove':
                        this.$canvas.addEventListener('touchmove', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('touchmove', e);
                            const points = this.getXY(event);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some((point) => drawable.isIn(point))
                                ) {
                                    drawable.emit('touchmove', e);
                                }
                            }
                        });
                        break;
                    case 'touchend':
                        this.$canvas.addEventListener('touchend', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('touchend', e);
                            const points = this.getXY(event);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some((point) => drawable.isIn(point))
                                ) {
                                    drawable.emit('touchend', e);
                                }
                            }
                        });
                        break;
                    case 'touchcancel':
                        this.$canvas.addEventListener(
                            'touchcancel',
                            (event) => {
                                const e = new DrawableEvent(event);
                                this.emit('touchcancel', e);
                                const points = this.getXY(event);
                                for (const drawable of this.$drawables) {
                                    if (
                                        drawable.$doDraw &&
                                        points.some((point) =>
                                            drawable.isIn(point)
                                        )
                                    ) {
                                        drawable.emit('touchcancel', e);
                                    }
                                }
                            },
                        );
                        break;
                    case 'mousemove':
                        this.$canvas.addEventListener('mousemove', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('mousemove', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('mousemove', e);
                                }
                            }
                        });
                        break;
                    case 'mousedown':
                        this.$canvas.addEventListener('mousedown', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('mousedown', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('mousedown', e);
                                }
                            }
                        });
                        break;
                    case 'mouseup':
                        this.$canvas.addEventListener('mouseup', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('mouseup', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('mouseup', e);
                                }
                            }
                        });
                        break;
                    case 'mouseleave':
                        this.$canvas.addEventListener('mouseleave', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('mouseleave', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('mouseleave', e);
                                }
                            }
                        });
                        break;
                    case 'mouseenter':
                        this.$canvas.addEventListener('mouseenter', (event) => {
                            const e = new DrawableEvent(event);
                            this.emit('mouseenter', e);
                            const point = this.getXY(event)[0];
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    drawable.emit('mouseenter', e);
                                }
                            }
                        });
                        break;
                }
            }
        }
    }

    /**
     * Width of the canvas
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @type {number}
     */
    get width() {
        return this.$canvas.width;
    }

    /**
     * Width of the canvas
     * @date 1/25/2024 - 12:50:19 PM
     *
     * @type {number}
     */
    set width(width: number) {
        this.$canvas.width = width;
    }

    /**
     * Height of the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @type {number}
     */
    get height() {
        return this.$canvas.height;
    }

    /**
     * Height of the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @type {number}
     */
    set height(height: number) {
        this.$canvas.height = height;
    }

    /**
     * Adds an event listener to the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @template {keyof CanvasEvents} K
     * @param {K} event
     * @param {(data: CanvasEvents[K]) => void} listener
     * @returns {void) => void}
     */
    on<K extends keyof CanvasEvents>(
        event: K,
        listener: (data: CanvasEvents[K]) => void,
    ) {
        this.$emitter.on(event, listener);
    }

    /**
     * Removes an event listener from the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @template {keyof CanvasEvents} K
     * @param {K} event
     * @param {(data: CanvasEvents[K]) => void} listener
     * @returns {void) => void}
     */
    off<K extends keyof CanvasEvents>(
        event: K,
        listener: (data: CanvasEvents[K]) => void,
    ) {
        this.$emitter.off(event, listener);
    }

    /**
     * Listens for an event once
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @template {keyof CanvasEvents} K
     * @param {K} event
     * @param {(data: CanvasEvents[K]) => void} listener
     * @returns {void) => void}
     */
    once<K extends keyof CanvasEvents>(
        event: K,
        listener: (data: CanvasEvents[K]) => void,
    ) {
        this.$emitter.once(event, listener);
    }

    /**
     * Emits an event
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @template {keyof CanvasEvents} K
     * @param {K} event
     * @param {CanvasEvents[K]} data
     */
    emit<K extends keyof CanvasEvents>(event: K, data: CanvasEvents[K]) {
        this.$emitter.emit(event, data);
    }

    /**
     * Adds drawables to the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @param {...Drawable[]} drawables
     */
    add(...drawables: Drawable[]) {
        this.$drawables.push(...drawables);
    }

    /**
     * Removes drawables from the canvas
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @param {...Drawable[]} drawables
     */
    remove(...drawables: Drawable[]) {
        for (const drawable of drawables) {
            const index = this.$drawables.indexOf(drawable);
            if (index !== -1) {
                this.$drawables.splice(index, 1);
            }
        }
    }

    /**
     * Clears the canvas context
     * @date 1/25/2024 - 12:50:18 PM
     */
    clear() {
        this.$ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Removes all drawables from the canvas
     * @date 1/25/2024 - 12:50:18 PM
     */
    clearDrawables() {
        this.$drawables.length = 0;
    }

    /**
     * Draws all drawables on the canvas
     * @date 1/25/2024 - 12:50:18 PM
     */
    draw() {
        this.clear();
        for (const drawable of this.$drawables) {
            this.$ctx.save();

            // forces the canvas to draw the drawable at a lower opacity
            const fadeScale = drawable.$currentFadeFrame / drawable.$fadeFrames;
            if (fadeScale < 1) {
                this.$ctx.globalAlpha = fadeScale;
            } else {
                this.$ctx.globalAlpha = 1;
            }

            if (!drawable.$doDraw) {
                this.$ctx.globalAlpha = 0;
            }

            if (drawable.$properties?.doDraw) {
                if (!drawable.$properties.doDraw(drawable)) {
                    this.$ctx.globalAlpha = 0;
                }
            }

            const res = attempt(() => drawable.draw(this.$ctx));
            this.$ctx.restore();
            if (res.isOk()) {
                if (
                    drawable.$currentFadeFrame > 0 &&
                    drawable.$currentFadeFrame < drawable.$fadeFrames
                ) {
                    drawable.$currentFadeFrame += drawable.$fadeDirection;
                }

                if (!drawable.$drawn) {
                    drawable.$drawn = true;
                    drawable.emit('draw', undefined);
                }
            }
        }
    }

    /**
     * Returns normalized points from a mouse or touch event
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @param {(MouseEvent | TouchEvent)} e
     * @returns {Point2D[]}
     */
    getXY(e: MouseEvent | TouchEvent): Point2D[] {
        const rect = this.$ctx.canvas.getBoundingClientRect();

        const makePoint = (x: number, y: number): [number, number] => {
            return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
        };

        if (e instanceof MouseEvent) {
            return [makePoint(e.clientX, e.clientY)];
        } else {
            return Array.from(e.touches).map((touch) =>
                makePoint(touch.clientX, touch.clientY)
            );
        }
    }

    /**
     * Removes all drawables, clears, and stops animation
     * @date 1/25/2024 - 12:50:18 PM
     */
    destroy() {
        this.clearDrawables();
        this.clear();
        this.$animating = false;
    }

    /**
     * Starts animating the canvas, returns a function to stop the animation
     * @date 1/25/2024 - 12:50:18 PM
     *
     * @returns {() => void}
     */
    animate(): () => void {
        const stop = () => (this.$animating = false);
        if (this.$animating) return stop;

        this.$animating = true;
        const loop = async () => {
            if (!this.$animating) return;
            this.clear();
            this.draw();
            // update?.(this);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        return stop;
    }
}
