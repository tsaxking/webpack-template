import { EventEmitter } from "./event-emitter.ts";

type StateEvent = 'new' | 'next' | 'prev';

type StateStackOptions = {
    max?: number;
    copy?: (data: any) => any;
}

class State<T> {
    emitter = new EventEmitter<'next' | 'prev'>();

    constructor(public readonly data: T, private readonly stack: StateStack<T>) {};

    next(): State<T> | undefined {
        return this.stack.next();
    }

    prev(): State<T> | undefined {
        return this.stack.prev();
    }
};

export class StateStack<T = any> {
    private readonly emitter = new EventEmitter<StateEvent>();
    public readonly states: State<T>[] = [];
    private index = -1;
    public options?: StateStackOptions;

    constructor(init?: T, options?: StateStackOptions) {
        if (init) this.add(init);
        this.options = options;
    }

    add(data: T): State<T> {
        const s = new State<T>(data, this);
        this.emitter.emit('new', s);

        if (this.index < this.states.length - 1) {
            this.states.splice(this.index + 1);
        }

        if (this.options?.max && this.states.length >= this.options.max) {
            this.states.shift();
            this.index--;
        }

        this.states.push(s);
        this.index++;

        return s;
    }

    next(): State<T> | undefined {
        if (this.index < this.states.length - 1) {
            this.index++;
            this.emitter.emit('next', this.current);
            return this.current;
        }
    }

    prev(): State<T> | undefined {
        if (this.index > 0) {
            this.index--;
            this.emitter.emit('prev', this.current);
            return this.current;
        }
    }

    get current(): State<T> | undefined {
        return this.states[this.index];
    }

    on(event: StateEvent, callback: (data: any) => void): void {
        this.emitter.on(event, callback);
    }

    off(event: StateEvent, callback?: (data: any) => void): void {
        this.emitter.off(event, callback);
    }
};

export class BranchStack<T = any> {
    branches: Map<string, StateStack<T>> = new Map();

    private currentBranch?: string;
    
    constructor() {};

    get current(): StateStack<T> | undefined {
        if (!this.currentBranch) return;
        return this.branches.get(this.currentBranch);
    }

    add(branch: string, data: T): StateStack<T> {
        if (!this.branches.has(branch)) {
            this.branches.set(branch, new StateStack<T>(data));
        }

        return this.branches.get(branch)!;
    };

    switch(branch: string): StateStack<T> | undefined {
        if (this.branches.has(branch)) {
            this.currentBranch = branch;
            return this.branches.get(branch)!;
        }
    }

    remove(branch: string): void {
        this.branches.delete(branch);
    }

    duplicate(branch: string, newName: string): StateStack<T> {
        const b = this.branches.get(branch);
        if (!b) throw new Error(`Branch ${branch} not found`);

        const newBranch = new StateStack<T>();

        for (const s of b.states) {
            let d = s.data;
            if (newBranch.options?.copy) d = newBranch.options.copy(d);

            newBranch.add(s.data);
        }

        this.branches.set(newName, newBranch);

        return newBranch;
    };
};