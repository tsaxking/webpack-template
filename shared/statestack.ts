import { EventEmitter } from './event-emitter.ts';

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
    copy?: (data: any) => any;
};

/**
 * Events for the state stack with their respective data type
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @typedef {StateStackEventData}
 * @template T
 */
export type StateStackEventData<T> = {
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
export class State<T> {
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
        private readonly stack: StateStack<T>,
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
 * @template [T=any]
 */
export class StateStack<T = any> {
    /**
     * Event emitter for state stack events
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @private
     * @readonly
     * @type {EventEmitter<keyof StateStackEventData<T>>}
     */
    private readonly $emitter: EventEmitter<keyof StateStackEventData<T>> =
        new EventEmitter<keyof StateStackEventData<T>>();
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
        this.$emitter.emit('new', s);

        if (this.index < this.states.length - 1) {
            this.states.splice(this.index + 1);
        }

        if (this.options?.max && this.states.length >= this.options.max) {
            this.states.shift();
            this.index--;
        }

        this.states.push(s);
        this.index++;
        this.$emitter.emit('change', this.current);

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
            this.$emitter.emit('next', this.current);
            this.$emitter.emit('change', this.current);
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
            this.$emitter.emit('prev', this.current);
            this.$emitter.emit('change', this.current);
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

    /**
     * Adds a listener for the given event
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @template {StateStackEvent<T>} K
     * @param {K} event
     * @param {(data: StateStackEventData<T>[K]) => void} callback
     */
    on<K extends keyof StateStackEventData<T>>(
        event: K,
        callback: (data: StateStackEventData<T>[K]) => void,
    ): void {
        this.$emitter.on(event, callback);
    }

    /**
     * Removes a listener for the given event
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @template {StateStackEvent<T>} K
     * @param {K} event
     * @param {?(data: StateStackEventData<T>[K]) => void} [callback]
     */
    off<K extends keyof StateStackEventData<T>>(
        event: K,
        callback?: (data: StateStackEventData<T>[K]) => void,
    ): void {
        this.$emitter.off(event, callback);
    }

    /**
     * Emits an event with the given data
     * @date 10/12/2023 - 2:33:03 PM
     *
     * @template {keyof StateStackEventData<T>} K
     * @param {K} event
     * @param {StateStackEventData<T>[K]} data
     */
    emit<K extends keyof StateStackEventData<T>>(
        event: K,
        data: StateStackEventData<T>[K],
    ): void {
        this.$emitter.emit(event, data);
    }
}

/**
 * Events for the branch stack with their respective data type
 * @date 10/12/2023 - 2:31:40 PM
 *
 * @typedef {BranchEventData}
 * @template T
 */
type BranchEventData<T> = {
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
 * @template [T=any]
 */
export class BranchStack<T = any> {
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
     * Event emitter for branch stack events
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @private
     * @type {EventEmitter<keyof BranchEventData<T>>}
     */
    private readonly $emitter: EventEmitter<keyof BranchEventData<T>> =
        new EventEmitter<keyof BranchEventData<T>>();

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
            this.$emitter.emit('new', this.branches.get(branch)!);
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
            this.$emitter.emit('switch', this.branches.get(branch)!);
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
        this.$emitter.emit('remove', branch);
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
            if (newBranch.options?.copy) d = newBranch.options.copy(d);

            newBranch.add(s.data);
        }

        this.branches.set(newName, newBranch);

        return newBranch;
    }

    /**
     * Adds a listener for the given event
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @template {BranchEvent<T>} K
     * @param {K} event
     * @param {(data: BranchEventData<T>[K]) => void} callback
     */
    on<K extends keyof BranchEventData<T>>(
        event: K,
        callback: (data: BranchEventData<T>[K]) => void,
    ): void {
        this.$emitter.on(event, callback);
    }

    /**
     * Removes a listener for the given event
     * @date 10/12/2023 - 2:31:40 PM
     *
     * @template {BranchEvent<T>} K
     * @param {K} event
     * @param {?(data: BranchEventData<T>[K]) => void} [callback]
     */
    off<K extends keyof BranchEventData<T>>(
        event: K,
        callback?: (data: BranchEventData<T>[K]) => void,
    ): void {
        this.$emitter.off(event, callback);
    }
}
