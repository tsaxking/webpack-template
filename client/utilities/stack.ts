import { Keyboard } from './keybinds';

type State = {
    name: string;
    undo: () => void;
    redo: () => void;
};

export class Stack {
    public static current?: Stack;

    public static undo() {
        if (Stack.current) {
            Stack.current.undo();
        }
    }

    public static redo() {
        if (Stack.current) {
            Stack.current.redo();
        }
    }

    public static use(stack: Stack) {
        Stack.current?.clear();
        console.log('Now using stack', stack.name);
        Stack.current = stack;
    }

    constructor(public readonly name: string) {}

    private _items: State[] = [];
    private index = -1;

    public get items() {
        return this._items;
    }

    push(state: State) {
        console.log('push', state.name);
        this.items.splice(this.index + 1);
        this.items.push(state);
        this.index++;
    }

    undo() {
        if (this.index >= 0) {
            console.log('undo', this.items[this.index].name);
            this.items[this.index].undo();
            this.index--;
        }
    }

    redo() {
        if (this.index < this.items.length - 1) {
            this.index++;
            console.log('redo', this.items[this.index].name);
            this.items[this.index].redo();
        }
    }

    clear() {
        this._items = [];
        this.index = -1;
    }
}

Keyboard.on('ctrl+z', () => Stack.undo());
Keyboard.on('ctrl+y', () => Stack.redo());

Object.assign(window, { Stack });
