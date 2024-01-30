import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { EventEmitter } from '../../../shared/event-emitter';
import {
    FillProperties,
    LineProperties,
    ShapeProperties,
    TextProperties,
} from './properties';
import { Canvas } from './canvas';

/**
 * Event wrapper for drawable events
 * @date 1/25/2024 - 1:25:32 PM
 *
 * @export
 * @class CanvasEvent
 * @typedef {DrawableEvent}
 * @template [e=unknown]
 */
export class DrawableEvent<e = unknown> {
    /**
     * Creates an instance of CanvasEvent.
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @constructor
     * @param {e} event
     */
    constructor(
        public readonly event: e,
        public readonly points: Point2D[],
        public readonly canvas: Canvas,
        public readonly drawable: Drawable,
    ) {}
}

/**
 * All drawable events
 * @date 1/25/2024 - 1:25:32 PM
 *
 * @typedef {DrawableEvents}
 */
type DrawableEvents = {
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
 * A blank drawable
 * @date 1/25/2024 - 1:25:32 PM
 *
 * @export
 * @class Drawable
 * @typedef {Drawable}
 * @template [T=unknown]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Drawable<T = any> {
    public readonly id = Math.random();

    public $canvas?: Canvas;

    public get $Math() {
        console.warn('Math not implemented on ' + this.constructor.name);
        return {};
    }

    constructor() {
        this.show();

        this.$emitter.on('draw', () => {
            this.$drawn = true;
        });
    }

    /**
     * Event emitter
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public readonly $emitter = new EventEmitter<keyof DrawableEvents>();
    /**
     * Draw the drawable
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @type {boolean}
     */
    public $doDraw = true;
    /**
     * If the drawable has been drawn
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @type {boolean}
     */
    public $drawn = false;
    /**
     * If the drawable is fading in or out
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @type {(-1 | 0 | 1)}
     */
    public $fadeDirection: -1 | 0 | 1 = 0; // -1 = fade out, 0 = no fade, 1 = fade in
    /**
     * The number of frames to fade in or out
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @type {number}
     */
    public $fadeFrames = 1;
    /**
     * The current frame of the fade
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @type {number}
     */
    public $currentFadeFrame = 1;
    /**
     * All properties of the drawable
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @public
     * @readonly
     * @type {Partial<ShapeProperties<T>>}
     */
    public readonly $$properties: ShapeProperties<T> = {
        fill: {},
        line: {},
        text: {},
        doDraw: () => true,
        mirror: {
            x: false,
            y: false,
        },
    };

    private $warned = false;

    get $properties() {
        if (!this.$warned) {
            console.warn(
                'Drawable.$properties will be deprecated in the future, use Drawable.properties instead',
            );
        }
        this.$warned = true;
        return this.$$properties;
    }

    /**
     * Add a listener to the given event
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @template {keyof DrawableEvents} K
     * @param {K} event
     * @param {(data: DrawableEvents[K]) => void} listener
     * @returns {void) => void}
     */
    on<K extends keyof DrawableEvents>(
        event: K,
        listener: (data: DrawableEvents[K]) => void,
    ) {
        this.$emitter.on(event, listener);
    }

    /**
     * Remove a listener from the given event
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @template {keyof DrawableEvents} K
     * @param {K} event
     * @param {(data: DrawableEvents[K]) => void} listener
     * @returns {void) => void}
     */
    off<K extends keyof DrawableEvents>(
        event: K,
        listener: (data: DrawableEvents[K]) => void,
    ) {
        this.$emitter.off(event, listener);
    }

    /**
     * Add a listener to the given event that will only be called once
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @template {keyof DrawableEvents} K
     * @param {K} event
     * @param {(data: DrawableEvents[K]) => void} listener
     * @returns {void) => void}
     */
    once<K extends keyof DrawableEvents>(
        event: K,
        listener: (data: DrawableEvents[K]) => void,
    ) {
        this.$emitter.once(event, listener);
    }

    /**
     * Emit the given event with the given data
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @template {keyof DrawableEvents} K
     * @param {K} event
     * @param {DrawableEvents[K]} data
     */
    emit<K extends keyof DrawableEvents>(event: K, data: DrawableEvents[K]) {
        this.$emitter.emit(event, data);
    }

    /**
     * Draw the drawable (must be implemented by child)
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @param {CanvasRenderingContext2D} _ctx
     */
    draw(_ctx: CanvasRenderingContext2D): void {
        console.warn('Method not implemented on ' + this.constructor.name);
    }

    /**
     * Returns if the given point is inside the drawable (must be implemented by child)
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @param {Point2D} _point
     * @returns {boolean}
     */
    isIn(_point: Point2D): boolean {
        console.warn('Method not implemented on ' + this.constructor.name);
        return false;
    }

    /**
     * Hide the drawable
     * @date 1/25/2024 - 1:25:32 PM
     */
    hide() {
        this.$doDraw = false;
        this.$fadeDirection = -1;
        this.$currentFadeFrame = this.$fadeFrames;
    }

    /**
     * Show the drawable
     * @date 1/25/2024 - 1:25:32 PM
     */
    show() {
        this.$doDraw = true;
        this.$fadeDirection = 1;
        this.$currentFadeFrame = this.$fadeFrames;
    }

    /**
     * Fade the drawable in or out
     * @date 1/25/2024 - 1:25:32 PM
     *
     * @param {number} frames
     */
    fade(frames: number) {
        this.$fadeFrames = frames;
        this.$currentFadeFrame = 1;
        this.$fadeDirection = 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clone(): any {
        throw new Error(`Method not implemented for ${this.constructor.name}`);
    }

    reflect(point: Point2D): Point2D {
        let [px, py] = point;
        if (this.properties.mirror) {
            const { x, y } = this.properties.mirror;
            if (x) {
                px = 1 - px;
            }
            if (y) {
                py = 1 - py;
            }
        }

        return [px, py];
    }

    get properties() {
        return this.$properties;
    }

    get fill() {
        return this.$properties.fill || {};
    }

    set fill(fill: Partial<FillProperties<T>>) {
        this.$properties.fill = fill;
    }

    get line() {
        return this.$properties.line || {};
    }

    set line(line: Partial<LineProperties<T>>) {
        this.$properties.line = line;
    }

    get text() {
        return this.$properties.text || {};
    }

    set text(text: Partial<TextProperties<T>>) {
        this.$properties.text = text;
    }

    set mirror(mirror: { x?: boolean; y?: boolean }) {
        this.$properties.mirror = mirror;
    }

    get mirror() {
        return this.$properties.mirror || {};
    }
}
