import { EventEmitter } from "./event-emitter.ts";

type StateStackOptions = {
    max?: number;
    copy?: (data: any) => any;
}

type StateStackEventData<T> = {
    'next': State<T>;
    'prev': State<T>;
    'new': State<T>;
    'change': State<T>;
};

type StateStackEvent<T> = keyof StateStackEventData<T>;



class State<T> {
    emitter = new EventEmitter<StateStackEvent<T>>();

    constructor(public readonly data: T, private readonly stack: StateStack<T>) {};

    next(): State<T> | undefined {
        return this.stack.next();
    }

    prev(): State<T> | undefined {
        return this.stack.prev();
    }
};

export class StateStack<T = any> {
    private readonly emitter = new EventEmitter<StateStackEvent<T>>();
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
        this.emitter.emit('change', this.current);

        return s;
    }

    next(): State<T> | undefined {
        if (this.index < this.states.length - 1) {
            this.index++;
            this.emitter.emit('next', this.current);
            this.emitter.emit('change', this.current);
            return this.current;
        }
    }

    prev(): State<T> | undefined {
        if (this.index > 0) {
            this.index--;
            this.emitter.emit('prev', this.current);
            this.emitter.emit('change', this.current);
            return this.current;
        }
    }

    get current(): State<T> | undefined {
        return this.states[this.index];
    }

    on<K extends StateStackEvent<T>>(event: K, callback: (data: StateStackEventData<T>[K]) => void): void {
        this.emitter.on(event, callback);
    }

    off<K extends StateStackEvent<T>>(event: K, callback?: (data: StateStackEventData<T>[K]) => void): void {
        this.emitter.off(event, callback);
    }
};

type BranchEventData<T> = {
    'new': StateStack<T>;
    'switch': StateStack<T>;
    'remove': string;
    'duplicate': StateStack<T>;
};

type BranchEvent<T> = keyof BranchEventData<T>;


export class BranchStack<T = any> {
    branches: Map<string, StateStack<T>> = new Map();

    private currentBranch?: string;
    private emitter = new EventEmitter<BranchEvent<T>>();
    
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


    on<K extends BranchEvent<T>>(event: K, callback: (data: BranchEventData<T>[K]) => void): void {
        this.emitter.on(event, callback);
    }

    off<K extends BranchEvent<T>>(event: K, callback?: (data: BranchEventData<T>[K]) => void): void {
        this.emitter.off(event, callback);
    }
};