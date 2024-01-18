// type Events =
//     'click' |
//     'mousedown' |
//     'mouseup' |
//     'mousemove' |
//     'mouseleave' |
//     'touchstart' |
//     'touchend' |
//     'touchmove' |
//     'touchcancel';

export interface Drawable {
    draw(ctx: CanvasRenderingContext2D): void;

    // on?(event: string, callback: (event: Event) => void): void;
}

export class Canvas {
    public readonly elements: Drawable[] = [];
    private animating = false;

    // TODO: Implement FPS
    // public fps: number = 0;

    constructor(public readonly ctx: CanvasRenderingContext2D) {}

    get width() {
        return this.ctx.canvas.width;
    }

    set width(width: number) {
        this.ctx.canvas.width = width;
    }

    set height(height: number) {
        this.ctx.canvas.height = height;
    }

    get height() {
        return this.ctx.canvas.height;
    }

    add(...elements: Drawable[]) {
        this.elements.push(...elements);
    }

    remove(...elements: Drawable[]) {
        for (const element of elements) {
            const index = this.elements.indexOf(element);
            if (index !== -1) this.elements.splice(index, 1);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    draw() {
        for (const element of this.elements) {
            this.ctx.save();
            element.draw(this.ctx);
            this.ctx.restore();
        }
    }

    get imageData() {
        return this.ctx.getImageData(0, 0, this.width, this.height);
    }

    set imageData(imageData: ImageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Animates the canvas (calls draw() every frame)
     * To change the animation, change the elements array outside of this class
     */
    animate(update?: (canvas: this) => void): () => void {
        const stop = () => (this.animating = false);
        if (this.animating) return stop;

        this.animating = true;
        const loop = async () => {
            if (!this.animating) return;
            // if (this.fps) await sleep(1000 / this.fps);
            this.clear();
            update?.(this);
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        return stop;
    }

    destroy() {
        this.clear();
        this.animating = false;
        this.elements.length = 0;
    }
}
