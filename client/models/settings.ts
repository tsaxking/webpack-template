import { EventEmitter } from '../../shared/event-emitter';
import { ServerRequest } from '../utilities/requests';
import { socket } from '../utilities/socket';

type SettingsEvents = {
    change: string | undefined;
};

export class Settings {
    static readonly $emitter = new EventEmitter<keyof SettingsEvents>();

    static readonly $settings = new Map<string, unknown>();

    static set<T>(key: string, value: T) {
        this.$settings.set(key, value);
        this.change();
    }

    static get<T>(key: string): T | undefined {
        return this.$settings.get(key) as T | undefined;
    }

    static has(key: string) {
        return this.$settings.has(key);
    }

    static delete(key: string) {
        this.$settings.delete(key);
        this.change();
    }

    static clear() {
        this.$settings.clear();
        this.change();
    }

    static get size() {
        return this.$settings.size;
    }

    static get keys() {
        return this.$settings.keys();
    }

    static get values() {
        return this.$settings.values();
    }

    static get entries() {
        return this.$settings.entries();
    }

    static forEach(
        callbackfn: (
            value: unknown,
            key: string,
            map: Map<string, unknown>,
        ) => void,
        thisArg?: unknown,
    ) {
        this.$settings.forEach(callbackfn, thisArg);
    }

    static [Symbol.iterator]() {
        return this.$settings[Symbol.iterator]();
    }

    static async change() {
        await ServerRequest.post('account/set-settings', {
            settings: JSON.stringify([...this.$settings]),
        });
    }

    static on<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.on(event, listener);
    }

    static once<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.once(event, listener);
    }

    static off<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.off(event, listener);
    }

    static emit<K extends keyof SettingsEvents>(
        event: K,
        value: SettingsEvents[K],
    ) {
        Settings.$emitter.emit(event, value);
    }

    static async init() {
        const res = await ServerRequest.post<[string, unknown][] | undefined>(
            'account/get-settings',
        );
        if (res.isOk()) {
            const settings = res.value;
            Settings.$settings.clear();

            if (!settings) return;
            if (!Array.isArray(settings)) return; // data is corrupted

            for (const [key, value] of settings) {
                // set without loop
                if (Settings.$settings.get(key) === value) continue; // no change
                Settings.$settings.set(key, value);
                Settings.emit('change', key);
            }
        }
    }
}

socket.on('account:settings-set', (settings: string) => {
    Settings.$settings.clear();

    const parsed = JSON.parse(settings) as [string, unknown][];
    for (const [key, value] of parsed) {
        // set without loop
        if (Settings.$settings.get(key) === value) continue; // no change
        Settings.$settings.set(key, value);
        Settings.emit('change', key);
    }
});
