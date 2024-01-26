import { copy } from '../../../shared/copy';
import { Point2D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Drawable } from './drawable';

export class Container extends Drawable<Container> {
    private $children: (Drawable | null)[] = [];
    private $filtered: Drawable[] = [];

    constructor(...children: (Drawable | null)[]) {
        super();

        this.children = children;
    }

    set children(children: (Drawable | null)[]) {
        this.$children = children;
        this.filter((child) => child !== null);
    }

    get children() {
        return this.$children;
    }

    get filtered() {
        return this.$filtered;
    }

    filter(
        fn: (
            element: Drawable | null,
            i: number,
            arr: (Drawable | null)[],
        ) => boolean,
    ) {
        this.$filtered = this.$children
            .filter(fn)
            .filter((child) => child !== null) as Drawable[];
    }

    sort(fn: (a: Drawable, b: Drawable) => number) {
        this.$filtered.sort(fn);
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.$filtered.forEach((child) => child.draw(ctx));
    }

    isIn(point: Point2D) {
        return this.$filtered.some((child) => child.isIn(point));
    }

    clone(): Container {
        const c = new Container(
            ...this.$children.map((child) => child?.clone() || null),
        );
        copy(this, c);
        return c;
    }
}
