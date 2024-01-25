export type LineProperties<T = unknown> = {
    width: number;
    color: string;
    doDraw: (element: T) => boolean;
};

export type FillProperties<T = unknown> = {
    color: string;
    doDraw: (element: T) => boolean;
};

export type TextProperties<T = unknown> = {
    font: string;
    color: string;
    height: number;
    width: number;
    doDraw: (element: T) => boolean;
};

export type ShapeProperties<T = unknown> = Partial<{
    line: Partial<LineProperties<T>>;
    fill: Partial<FillProperties<T>>;
    text: Partial<TextProperties<T>>;
    doDraw: (element: T) => boolean;
}>;
