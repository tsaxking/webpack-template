import { attempt, isSimilar } from './check';

type Case<T, R> = {
    match: T;
    fn: (value: T) => R;
};

class MatchStatement<T, R> {
    private readonly cases: Case<T, R>[] = [];

    private defaultCase: ((v: T) => R) | null = null;

    constructor(private readonly value: T) {}

    public case<K extends T>(match: K, fn: (value: T) => R) {
        this.cases.push({ match, fn });
        return this;
    }

    public default(fn: (value: T) => R) {
        this.defaultCase = fn;
        return this;
    }

    public exec() {
        return attempt(() => {
            for (const { match, fn } of this.cases) {
                if (isSimilar(this.value, match)) {
                    return fn(this.value);
                }
            }

            if (this.defaultCase) {
                return this.defaultCase(this.value);
            }
            throw new Error('No match found');
        });
    }
}

export const match = <T, R>(value: T) => new MatchStatement<T, R>(value);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = new (...args: any[]) => any;

type InstanceCase<I extends Instance, T, R> = {
    match: I;
    fn: (value: T) => R;
};

class MatchInstanceStatement<T, R> {
    private readonly cases: InstanceCase<Instance, T, R>[] = [];

    private defaultCase: ((v: T) => R) | null = null;

    constructor(private readonly value: T) {}

    public case(match: Instance, fn: (value: T) => R) {
        this.cases.push({ match, fn });
        return this;
    }

    public default(fn: (value: T) => R) {
        this.defaultCase = fn;
        return this;
    }

    public exec() {
        return attempt(() => {
            for (const { match, fn } of this.cases) {
                if (this.value instanceof match) {
                    return fn(this.value);
                }
            }

            if (this.defaultCase) {
                return this.defaultCase(this.value);
            }
            throw new Error('No match found');
        });
    }
}

export const matchInstance = <T, R>(value: T) =>
    new MatchInstanceStatement<T, R>(value);
