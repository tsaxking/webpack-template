import { Point3D } from './point';

/**
 * A 2d array of numbers
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @typedef {M}
 */
type M = number[][];
/**
 * A 3x3 matrix of numbers
 * @date 1/10/2024 - 2:35:33 PM
 *
 * @typedef {SpatialMatrix}
 */
export type SpatialMatrix = [Point3D, Point3D, Point3D];

export class Matrix {
    public static identity(size: number) {
        const matrix: number[][] = [];

        for (let i = 0; i < size; i++) {
            matrix[i] = [];

            for (let j = 0; j < size; j++) {
                matrix[i][j] = i === j ? 1 : 0;
            }
        }

        return matrix;
    }

    constructor(public readonly data: M) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].length !== data[0].length) {
                throw new Error('Matrix is not rectangular');
            }
        }
    }

    public get length() {
        return this.data.length;
    }

    public get width() {
        return this.data[0].length;
    }

    public multiply(matrix: Matrix) {
        // ensure that the matricies are compatible
        if (this.data[0].length !== matrix.length) {
            throw new Error(
                'Matricies are not compatible, ' +
                    'A: ' +
                    this.length +
                    'x' +
                    this.data[0].length +
                    ' B: ' +
                    matrix.length +
                    'x' +
                    matrix.data[0].length +
                    ''
            );
        }

        // create the new matrix
        const c: number[][] = [];

        // for each row in a
        for (let i = 0; i < this.length; i++) {
            // create a new row
            c[i] = [];

            // for each column in b
            for (let j = 0; j < matrix.data[0].length; j++) {
                // create a new column
                c[i][j] = 0;

                // for each element in the column
                for (let k = 0; k < matrix.length; k++) {
                    // add the product of the elements
                    c[i][j] += this.data[i][k] * matrix.data[k][j];
                }
            }
        }

        return c;
    }

    public transpose() {
        const matrix: number[][] = [];

        for (let i = 0; i < this.data[0].length; i++) {
            matrix[i] = [];

            for (let j = 0; j < this.length; j++) {
                matrix[i][j] = this.data[j][i];
            }
        }

        return matrix;
    }

    public getRow(index: number) {
        return this.data[index];
    }

    public getColumn(index: number) {
        return this.transpose()[index];
    }
}
