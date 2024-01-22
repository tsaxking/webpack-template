type Fn<X = unknown> = (x: X) => X;

export const pipe = <X = unknown>(arr: X[], ...fns: Fn<X>[]): X[] =>
    fns.reduce((acc, fn) => acc.map(fn), arr);
