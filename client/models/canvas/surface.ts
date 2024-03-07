import { Point3D } from '../../../shared/submodules/calculations/src/linear-algebra/point';
import { Drawable } from './drawable';
import { Polygon } from './polygon';
import { transform } from '../../../shared/submodules/calculations/src/linear-algebra/matrix-calculations';

export class Surface extends Drawable<Surface> {
    public triangles: Polygon[] = [];

    constructor(
        public fz: (x: number, y: number) => number,
        public resolution: number,
        // for drawing the 3d surface on the 2d canvas
        // this is called every time the surface is drawn
        public transformMatrix: [Point3D, Point3D, Point3D]
    ) {
        super();
        this.createTriangles();
    }

    get points(): Point3D[] {
        const a = Array.from({ length: this.resolution }, (_, i) => {
            return Array.from({ length: this.resolution }, (_, j) => {
                return [
                    i,
                    j / this.resolution,
                    this.fz(i / this.resolution, j / this.resolution) *
                        this.resolution
                ];
            });
            // need to flatten the array because the array is an array of arrays, and we want an array of points
        }).flat() as Point3D[];

        const max = Math.max(...a.map(p => p[2]));
        // normalize the z values

        return a.map(p => {
            return [p[0], p[1], p[2] / max];
        });
    }

    createTriangles(): Polygon[] {
        this.triangles = [];
        const { points } = this;

        for (let i = 0; i < this.resolution - 1; i++) {
            const p = points[i];
            // get the next 4 points to make triangles
            // only need for because it's always looking ahead, the other triangles have already been pushed
            const p1 = points[i + 1];
            const p2 = points[i + this.resolution];
            const p3 = points[i + this.resolution + 1];
            const p4 = points[i + this.resolution + 2];

            const max = Math.max(+p[2], +p1[2], +p2[2], +p3[2], +p4[2]);
            const color = `rgb(${max * 255 * this.resolution}, ${
                max * 255 * this.resolution
            }, ${max * 255 * this.resolution})`;

            if (p1 && p2 && p4) {
                const triangle = new Polygon([p, p1, p2]);
                triangle.properties.fill = {
                    color
                };
                this.triangles.push(triangle);
            }
            if (p1 && p4 && p3) {
                const triangle = new Polygon([p, p1, p4]);
                triangle.properties.fill = {
                    color
                };
                this.triangles.push(triangle);
            }
            if (p1 && p3 && p2) {
                const triangle = new Polygon([p, p1, p3]);
                triangle.properties.fill = {
                    color
                };
                this.triangles.push(triangle);
            }
        }

        return this.triangles;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.triangles.length) this.createTriangles();
        for (const triangle of this.triangles) {
            const { points } = triangle;
            triangle.points = points.map(p =>
                transform(p as Point3D, this.transformMatrix)
            );
            triangle.draw(ctx);
            triangle.points = points;
        }
    }
}
