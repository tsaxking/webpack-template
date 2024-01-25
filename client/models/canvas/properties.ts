/* eslint-disable @typescript-eslint/no-explicit-any */
export type LineProperties<T = any> = {
    width: number;
    color: string;
    doDraw: (element: T) => boolean;
};

export type FillProperties<T = any> = {
    color: string;
    doDraw: (element: T) => boolean;
};

export type TextProperties<T = any> = {
    font: string;
    color: string;
    height: number;
    width: number;
    doDraw: (element: T) => boolean;
};

export type ShapeProperties<T = any> = Partial<{
    line: Partial<LineProperties<T>>;
    fill: Partial<FillProperties<T>>;
    text: Partial<TextProperties<T>>;
    doDraw: (element: T) => boolean;
}>;
