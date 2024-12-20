import { EventEmitter } from './event-emitter';

/**
 * Options for the state stack
 * Max: Maximum number of states to keep in the stack
 * Copy: Function to copy the data when adding a new state (useful for objects)
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @typedef {StateStackOptions}
 */
type StateStackOptions = {
    max?: number;
    copy?: (data: unknown) => unknown;
};

/**
 * Events for the state stack with their respective data type
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @typedef {StateStackEventData}
 * @template T
 */
export type StateStackEventData<T = unknown> = {
    next: State<T>;
    prev: State<T>;
    new: State<T>;
    change: State<T>;
};

/**
 * This is a state in the state stack (duh)
 * This is used to store data, change states, and emit events
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @class State
 * @typedef {State}
 * @template T
 */
export class State<T = unknown> {
    /**
     * Date the state was created
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @readonly
     * @type {Date}
     */
    public readonly created: Date = new Date();

    /**
     * Creates an instance of State.
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @constructor
     * @param {T} data
     * @param {StateStack<T>} stack
     */
    constructor(
        public readonly data: T,
        private readonly stack: StateStack<T>
    ) {}

    /**
     * Returns the next state in the stack (if it exists)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @returns {(State<T> | undefined)}
     */
    next(): State<T> | undefined {
        return this.stack.next();
    }

    /**
     * Returns the previous state in the stack (if it exists)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @returns {(State<T> | undefined)}
     */
    prev(): State<T> | undefined {
        return this.stack.prev();
    }
}

/**
 * This is a class meant to store data in a stack
 * This is useful for undo/redo, navigation, etc.
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @export
 * @class StateStack
 * @typedef {StateStack}
 * @template [T=unknown]
 */
export class StateStack<T = unknown> extends EventEmitter<
    StateStackEventData<T>
> {
    /**
     * List of states in the stack
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @public
     * @readonly
     * @type {State<T>[]}
     */
    public readonly states: State<T>[] = [];
    /**
     * Index of the current state
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @private
     * @type {number}
     */
    private index = -1;
    /**
     * Options for the state stack
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @public
     * @type {?StateStackOptions}
     */
    public options?: StateStackOptions;

    /**
     * Creates an instance of StateStack.
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @constructor
     * @param {?T} [init]
     * @param {?StateStackOptions} [options]
     */
    constructor(init?: T, options?: StateStackOptions) {
        super();
        if (init) this.add(init);
        this.options = options;
    }

    /**
     * Adds a new state to the stack (emits 'new' and 'change' events)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @param {T} data
     * @returns {State<T>}
     */
    add(data: T): State<T> {
        const s = new State<T>(data, this);
        this.emit('new', s);

        if (this.index < this.states.length - 1) {
            this.states.splice(this.index + 1);
        }

        if (this.options?.max && this.states.length >= this.options.max) {
            this.states.shift();
            this.index--;
        }

        this.states.push(s);
        this.index++;
        const { current } = this;
        if (current) this.emit('change', current);

        return s;
    }

    /**
     * Next state in the stack (if it exists) (emits 'next' and 'change' events)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @returns {(State<T> | undefined)}
     */
    next(): State<T> | undefined {
        if (this.index < this.states.length - 1) {
            this.index++;
            const { current } = this;
            if (current) {
                this.emit('next', current);
                this.emit('change', current);
            }
            return this.current;
        }
    }

    /**
     * Previous state in the stack (if it exists) (emits 'prev' and 'change' events)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @returns {(State<T> | undefined)}
     */
    prev(): State<T> | undefined {
        if (this.index > 0) {
            this.index--;
            const { current } = this;
            if (current) {
                this.emit('prev', current);

                this.emit('change', current);
            }
            return this.current;
        }
    }

    /**
     * Current state in the stack (if it exists)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @readonly
     * @type {(State<T> | undefined)}
     */
    get current(): State<T> | undefined {
        return this.states[this.index];
    }
}

/**
 * Events for the branch stack with their respective data type
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @typedef {BranchEventData}
 * @template T
 */
type BranchEventData<T = unknown> = {
    new: StateStack<T>;
    switch: StateStack<T>;
    remove: string;
    duplicate: StateStack<T>;
};

/**
 * This is a class meant store multiple state stacks as branches
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @export
 * @class BranchStack
 * @typedef {BranchStack}
 * @template [T=unknown]
 */
export class BranchStack<T = unknown> extends EventEmitter<BranchEventData<T>> {
    /**
     * List of branches in the stack
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @type {Map<string, StateStack<T>>}
     */
    public readonly branches: Map<string, StateStack<T>> = new Map();

    /**
     * Current branch
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @private
     * @type {?string}
     */
    private currentBranch?: string;

    /**
     * Returns the current branch (if it exists)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @readonly
     * @type {(StateStack<T> | undefined)}
     */
    get current(): StateStack<T> | undefined {
        if (!this.currentBranch) return undefined;
        return this.branches.get(this.currentBranch);
    }

    /**
     * Adds a new branch to the stack (emits 'new' event)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @param {string} branch
     * @param {T} data
     * @returns {StateStack<T>}
     */
    add(branch: string, data: T): StateStack<T> {
        if (!this.branches.has(branch)) {
            this.branches.set(branch, new StateStack<T>(data));
            this.emit('new', this.branches.get(branch)!);
        }

        return this.branches.get(branch)!;
    }

    /**
     * Switches to the given branch (if it exists) (emits 'switch' event)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @param {string} branch
     * @returns {(StateStack<T> | undefined)}
     */
    switch(branch: string): StateStack<T> | undefined {
        if (this.branches.has(branch)) {
            this.currentBranch = branch;
            this.emit('switch', this.branches.get(branch)!);
            return this.branches.get(branch)!;
        }
    }

    /**
     * Removes the given branch (if it exists) (emits 'remove' event)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @param {string} branch
     */
    remove(branch: string): void {
        this.branches.delete(branch);
        this.emit('remove', branch);
    }

    /**
     * Duplicates the given branch (if it exists) (emits 'duplicate' event)
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @param {string} branch
     * @param {string} newName
     * @returns {StateStack<T>}
     */
    duplicate(branch: string, newName: string): StateStack<T> {
        const b = this.branches.get(branch);
        if (!b) throw new Error(`Branch ${branch} not found`);

        const newBranch = new StateStack<T>();

        for (const s of b.states) {
            let d = s.data;
            if (newBranch.options?.copy) d = newBranch.options.copy(d) as T;

            newBranch.add(s.data);
        }

        this.branches.set(newName, newBranch);

        return newBranch;
    }
}
