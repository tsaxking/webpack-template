import { Drawable, DrawableEvent } from './drawable';
import { EventEmitter } from '../../../shared/event-emitter';
import { attempt } from '../../../shared/check';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Color } from '../../submodules/colors/color';
import { Background } from './background';

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
    click: CanvasEvent<MouseEvent>;
    touchstart: CanvasEvent<TouchEvent>;
    touchmove: CanvasEvent<TouchEvent>;
    touchend: CanvasEvent<TouchEvent>;
    touchcancel: CanvasEvent<TouchEvent>;
    mousemove: CanvasEvent<MouseEvent>;
    mousedown: CanvasEvent<MouseEvent>;
    mouseup: CanvasEvent<MouseEvent>;
    mouseover: CanvasEvent<MouseEvent>;
    mouseleave: CanvasEvent<MouseEvent>;
    mouseenter: CanvasEvent<MouseEvent>;
};

export class CanvasEvent<T> {
    constructor(
        public readonly event: T,
        public readonly points: Point2D[]
    ) {}
}

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
    background: Color;
};

/**
 * A class to manage the canvas and drawables
 * @date 1/25/2024 - 12:50:19 PM
 *
 * @export
 * @class Canvas
 * @typedef {Canvas}
 */
export class Canvas<T = unknown> {
    public $data?: T;

    get data(): T | undefined {
        return this.$data;
    }

    set data(data: T | undefined) {
        this.$data = data;
    }

    public background: Background;

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
        options: Partial<CanvasOptions> = {}
    ) {
        this.$canvas = ctx.canvas;
        this.$ctx = ctx;
        this.$options = options;
        this.background = new Background();
        this.background.color = options.background || Color.fromName('white');
        this.add(this.background);

        if (this.$options.events) {
            this.$options.events = this.$options.events.filter(
                (e, i, a) => a.indexOf(e) === i
            );
            for (const event of this.$options.events) {
                switch (event) {
                    case 'click':
                        this.$canvas.addEventListener('click', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('click', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
                                    // console.log('clicked!', drawable);
                                    drawable.emit('click', e);
                                }
                            }
                        });
                        break;
                    case 'touchstart':
                        this.$canvas.addEventListener('touchstart', event => {
                            const points = this.getXY(event);
                            const e = new CanvasEvent(event, points);
                            this.emit('touchstart', e);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some(point => drawable.isIn(point))
                                ) {
                                    const e = new DrawableEvent(
                                        event,
                                        points,
                                        this,
                                        drawable
                                    );
                                    drawable.emit('touchstart', e);
                                }
                            }
                        });
                        break;
                    case 'touchmove':
                        this.$canvas.addEventListener('touchmove', event => {
                            const points = this.getXY(event);
                            const e = new CanvasEvent(event, points);
                            this.emit('touchmove', e);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some(point => drawable.isIn(point))
                                ) {
                                    const e = new DrawableEvent(
                                        event,
                                        points,
                                        this,
                                        drawable
                                    );
                                    drawable.emit('touchmove', e);
                                }
                            }
                        });
                        break;
                    case 'touchend':
                        this.$canvas.addEventListener('touchend', event => {
                            const points = this.getXY(event);
                            const e = new CanvasEvent(event, points);
                            this.emit('touchend', e);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some(point => drawable.isIn(point))
                                ) {
                                    const e = new DrawableEvent(
                                        event,
                                        points,
                                        this,
                                        drawable
                                    );
                                    drawable.emit('touchend', e);
                                }
                            }
                        });
                        break;
                    case 'touchcancel':
                        this.$canvas.addEventListener('touchcancel', event => {
                            const points = this.getXY(event);
                            const e = new CanvasEvent(event, points);
                            this.emit('touchcancel', e);
                            for (const drawable of this.$drawables) {
                                if (
                                    drawable.$doDraw &&
                                    points.some(point => drawable.isIn(point))
                                ) {
                                    const e = new DrawableEvent(
                                        event,
                                        points,
                                        this,
                                        drawable
                                    );
                                    drawable.emit('touchcancel', e);
                                }
                            }
                        });
                        break;
                    case 'mousemove':
                        this.$canvas.addEventListener('mousemove', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('mousemove', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
                                    drawable.emit('mousemove', e);
                                }
                            }
                        });
                        break;
                    case 'mousedown':
                        this.$canvas.addEventListener('mousedown', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('mousedown', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
                                    drawable.emit('mousedown', e);
                                }
                            }
                        });
                        break;
                    case 'mouseup':
                        this.$canvas.addEventListener('mouseup', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('mouseup', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
                                    drawable.emit('mouseup', e);
                                }
                            }
                        });
                        break;
                    case 'mouseleave':
                        this.$canvas.addEventListener('mouseleave', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('mouseleave', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
                                    drawable.emit('mouseleave', e);
                                }
                            }
                        });
                        break;
                    case 'mouseenter':
                        this.$canvas.addEventListener('mouseenter', event => {
                            const point = this.getXY(event)[0];
                            const e = new CanvasEvent(event, [point]);
                            this.emit('mouseenter', e);
                            for (const drawable of this.$drawables) {
                                if (drawable.$doDraw && drawable.isIn(point)) {
                                    const e = new DrawableEvent(
                                        event,
                                        [point],
                                        this,
                                        drawable
                                    );
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

    private $ratio = 1;

    get ratio() {
        return this.$ratio;
    }

    set ratio(number: number) {
        this.$ratio = number;
    }

    private $adaptable = false;

    set adaptable(adaptable: boolean) {
        this.$adaptable = adaptable;
        const { parentElement } = this.$canvas;
        if (parentElement) {
            parentElement.style.position = 'relative';
            this.$canvas.style.position = 'absolute';
        }
    }

    get adaptable() {
        return this.$adaptable;
    }

    private setView() {
        if (!this.adaptable) return;
        const { parentElement } = this.$canvas;

        if (parentElement) {
            const { width, height } = parentElement.getBoundingClientRect();
            if (width / height > this.ratio) {
                // ratio is too wide
                const xOffset = (width - height * this.ratio) / 2;
                this.$canvas.style.width = height * this.ratio + 'px';
                this.$canvas.style.height = height + 'px';
                this.$canvas.style.left = xOffset + 'px';
                this.$canvas.style.top = '0px';
            } else if (width / height < this.ratio) {
                // ratio is too tall
                const yOffset = (height - width / this.ratio) / 2;
                this.$canvas.style.width = width + 'px';
                this.$canvas.style.height = width / this.ratio + 'px';
                this.$canvas.style.left = '0px';
                this.$canvas.style.top = yOffset + 'px';
            } else {
                // ratio is exactly the same
                this.$canvas.style.width = width + 'px';
                this.$canvas.style.height = height + 'px';
                this.$canvas.style.left = '0px';
                this.$canvas.style.top = '0px';
            }
        }
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
        listener: (data: CanvasEvents[K]) => void
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
        listener: (data: CanvasEvents[K]) => void
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
        listener: (data: CanvasEvents[K]) => void
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
        this.$drawables.push(
            ...drawables.map(d => {
                d.$canvas = this;
                return d;
            })
        );
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
        this.add(this.background);
    }

    /**
     * Draws all drawables on the canvas
     * @date 1/25/2024 - 12:50:18 PM
     */
    draw() {
        this.clear();
        this.setView();
        for (const drawable of this.$drawables) {
            this.$ctx.save();

            // forces the canvas to draw the drawable at a lower opacity
            const fadeScale = drawable.$currentFadeFrame / drawable.$fadeFrames;
            // console.log(fadeScale);
            if (fadeScale < 1) {
                this.$ctx.globalAlpha = fadeScale;
            } else {
                this.$ctx.globalAlpha = 1;
            }

            let draw = true;

            if (!drawable.$doDraw) {
                this.$ctx.globalAlpha = 0;
                draw = false;
            }

            if (drawable.$properties?.doDraw) {
                if (!drawable.$properties.doDraw(drawable)) {
                    // drawable.hide();
                    this.$ctx.globalAlpha = 0;
                    draw = false;
                }
            } else {
                // drawable.show();
            }

            const res = attempt(() => drawable.draw(this.$ctx));
            this.$ctx.restore();
            if (res.isOk()) {
                if (
                    drawable.$currentFadeFrame > 1 &&
                    drawable.$currentFadeFrame < drawable.$fadeFrames
                ) {
                    drawable.$currentFadeFrame += drawable.$fadeDirection;
                }

                if (!drawable.$drawn && draw) {
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
            return Array.from(e.touches).map(touch =>
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
    animate(fn?: () => void): () => void {
        const stop = () => (this.$animating = false);
        if (this.$animating) return stop;

        this.$animating = true;
        const loop = async () => {
            if (!this.$animating) return;
            this.clear();
            this.draw();
            fn?.();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        return stop;
    }
}
