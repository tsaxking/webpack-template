type KeyFn = () => void;

// type Key = 'Escape' |
//     'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' |
//     'Backquote' | 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'Digit9' | 'Digit0' |
//     'Minus' | 'Equal' | 'Backspace' |
//     'Tab' | 'KeyQ' | 'KeyW' | 'KeyE' | 'KeyR' | 'KeyT' | 'KeyY' | 'KeyU' | 'KeyI' | 'KeyO' | 'KeyP' |
//     'BracketLeft' | 'BracketRight' | 'Backslash' | 'CapsLock' |
//     'KeyA' | 'KeyS' | 'KeyD' | 'KeyF' | 'KeyG' | 'KeyH' | 'KeyJ' | 'KeyK' | 'KeyL' | 'Semicolon' | 'Quote' | 'Enter' |
//     'ShiftLeft' | 'KeyZ' | 'KeyX' | 'KeyC' | 'KeyV' | 'KeyB' | 'KeyN' | 'KeyM' | 'Comma' | 'Period' | 'Slash' | 'ShiftRight' |
//     'ControlLeft' | 'MetaLeft' | 'AltLeft' | 'Space' | 'AltRight' | 'MetaRight' | 'ContextMenu' | 'ControlRight' |
//     'PrintScreen' | 'ScrollLock' | 'Pause' |
//     'Insert' | 'Home' | 'PageUp' | 'Delete' | 'End' | 'PageDown' |
//     'ArrowUp' | 'ArrowLeft' | 'ArrowDown' | 'ArrowRight' |
//     'NumLock' | 'NumpadDivide' | 'NumpadMultiply' | 'NumpadSubtract' |
//     'Numpad7' | 'Numpad8' | 'Numpad9' | 'NumpadAdd' |
//     'Numpad4' | 'Numpad5' | 'Numpad6' | 'Numpad1' | 'Numpad2' | 'Numpad3' | 'NumpadEnter' |
//     'Numpad0' | 'NumpadDecimal';

export class Keyboard {
    private static readonly keyboards = new Map<string, Keyboard>();
    private static _current = new Keyboard('default');

    public static get all() {
        return Array.from(Keyboard.keyboards.values());
    }

    public static get default() {
        return Keyboard.keyboards.get('default') as Keyboard;
    }

    public static get current() {
        return Keyboard._current;
    }

    public static use(keyboard: Keyboard) {
        console.log('Switching keyboard to', keyboard.name);
        Keyboard._current = keyboard;
    }

    private static readonly global = new Map<string, KeyFn[]>();

    public static on(key: string, fn: KeyFn) {
        const fns = Keyboard.global.get(key) || [];
        fns.push(fn);
        Keyboard.global.set(key, fns);
    }

    public static off(key: string, fn: KeyFn) {
        const fns = Keyboard.global.get(key) || [];
        const index = fns.indexOf(fn);
        if (index !== -1) fns.splice(index, 1);
    }

    public static get(key: string) {
        return Keyboard.current.listeners.get(key) || Keyboard.global.get(key);
    }

    constructor(public readonly name: string) {
        Keyboard.keyboards.set(name, this);
    }

    private readonly listeners = new Map<string, KeyFn[]>();

    public on(key: string, fn: KeyFn) {
        const fns = this.listeners.get(key) || [];
        fns.push(fn);
        this.listeners.set(key, fns);
    }

    public off(key: string, fn: KeyFn) {
        const fns = this.listeners.get(key) || [];
        const index = fns.indexOf(fn);
        if (index !== -1) fns.splice(index, 1);
    }

    public combine(...keyboard: Keyboard[]) {
        for (let i = 0; i < keyboard.length; i++) {
            const kb = keyboard[i];
            const entries = kb.listeners.entries();
            for (let j = 0; j < kb.listeners.size; j++) {
                const [key, fn] = entries.next().value;
                this.on(key, fn);
            }
        }
    }
}

document.addEventListener('keydown', e => {
    const alt = e.altKey ? 'alt+' : '';
    const ctrl = e.ctrlKey ? 'ctrl+' : '';
    const shift = e.shiftKey ? 'shift+' : '';
    const key = alt + ctrl + shift + e.key;

    // always only use the first keybind
    const [global] = Keyboard.get(key) || [];
    if (global) global();
});

Object.assign(window, { Keyboard });
