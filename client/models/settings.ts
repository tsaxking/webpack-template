import { attemptAsync } from '../../shared/check';
import { EventEmitter } from '../../shared/event-emitter';
import { ServerRequest } from '../utilities/requests';
import { socket } from '../utilities/socket';
import { Account } from './account';

/**
 * All events on the static Settings object
 * @date 2/8/2024 - 4:25:18 PM
 *
 * @typedef {SettingsEvents}
 */
type SettingsEvents = {
    set: [string, unknown];
};

/**
 * A setting object, contains the name, type, value, options, and bindTo
 * @date 2/8/2024 - 4:25:18 PM
 *
 * @export
 * @typedef {SettingsType}
 * @template [T=unknown]
 */
export type SettingsType<T = unknown> = {
    name: string;
    type: 'range' | 'switch' | 'select';
    value?: T;
    options?: string[] | [number, number];
    bindTo?: string;
};

/**
 *  A class for managing settings
 * @date 2/8/2024 - 4:25:18 PM
 *
 * @export
 * @class Settings
 * @typedef {Settings}
 */
export class Settings {
    /**
     * Event emitter for settings object updates
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly $emitter = new EventEmitter<keyof SettingsEvents>();

    /**
     * All settings in the system
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static readonly $settings = new Map<string, unknown>();

    /**
     * Set a setting
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template T
     * @param {string} key
     * @param {T} value
     */
    static set<T>(key: string, value: T) {
        this.$settings.set(key, value);
        this.change();
    }

    /**
     *  Get a setting
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template T
     * @param {string} key
     * @returns {(T | undefined)}
     */
    static get<T>(key: string): T | undefined {
        return this.$settings.get(key) as T | undefined;
    }

    /**
     * Check if a setting exists
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @param {string} key
     * @returns {*}
     */
    static has(key: string) {
        return this.$settings.has(key);
    }

    /**
     * Remove a setting
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @param {string} key
     */
    static delete(key: string) {
        this.$settings.delete(key);
        this.change();
    }

    /**
     * Clear all settings
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     */
    static clear() {
        this.$settings.clear();
        this.change();
    }

    /**
     * The number of settings
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static get size() {
        return this.$settings.size;
    }

    /**
     * All setting keys
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static get keys() {
        return this.$settings.keys();
    }

    /**
     * All setting values
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static get values() {
        return this.$settings.values();
    }

    /**
     * All setting entries (key-value pairs)
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @readonly
     * @type {*}
     */
    static get entries() {
        return this.$settings.entries();
    }

    /**
     * Iterate over all settings
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @param {(
     *             value: unknown,
     *             key: string,
     *             map: Map<string, unknown>,
     *         ) => void} callbackfn
     * @param {?unknown} [thisArg]
     * @returns {void, thisArg?: unknown) => void}
     */
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

    /**
     * Change a setting
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @async
     * @returns {*}
     */
    static async change() {
        if (!Account.current) return; // local changes only
        await ServerRequest.post('/account/set-settings', {
            settings: JSON.stringify([...this.$settings]),
        });
    }

    /**
     * Add a listener for settings object updates
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template {keyof SettingsEvents} K
     * @param {K} event
     * @param {(value: SettingsEvents[K]) => void} listener
     * @returns {void) => void}
     */
    static on<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.on(event, listener);
    }

    /**
     * Add a listener for settings object updates, then remove the listener
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template {keyof SettingsEvents} K
     * @param {K} event
     * @param {(value: SettingsEvents[K]) => void} listener
     * @returns {void) => void}
     */
    static once<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.once(event, listener);
    }

    /**
     * Remove a listener for settings object updates
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template {keyof SettingsEvents} K
     * @param {K} event
     * @param {(value: SettingsEvents[K]) => void} listener
     * @returns {void) => void}
     */
    static off<K extends keyof SettingsEvents>(
        event: K,
        listener: (value: SettingsEvents[K]) => void,
    ) {
        Settings.$emitter.off(event, listener);
    }

    /**
     * Emit an event for settings object updates
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @template {keyof SettingsEvents} K
     * @param {K} event
     * @param {SettingsEvents[K]} value
     */
    static emit<K extends keyof SettingsEvents>(
        event: K,
        value: SettingsEvents[K],
    ) {
        Settings.$emitter.emit(event, value);
    }

    /**
     * Initialize the settings object
     * @date 2/8/2024 - 4:25:18 PM
     *
     * @static
     * @async
     * @returns {unknown}
     */
    static async init() {
        return attemptAsync(async () => {
            const res = await ServerRequest.post<
                [string, unknown][] | undefined
            >('/account/get-settings');
            if (res.isOk()) {
                const settings = res.value;
                Settings.$settings.clear();

                if (!settings) throw new Error('No settings found');
                if (!Array.isArray(settings)) return; // data is corrupted

                for (const [key, value] of settings) {
                    // set without loop
                    if (Settings.$settings.get(key) === value) continue; // no change
                    Settings.$settings.set(key, value);
                    Settings.emit('set', [key, value]);
                }
            }
        });
    }
}

socket.on('account:settings-set', (settings: string) => {
    Settings.$settings.clear();

    const parsed = JSON.parse(settings) as [string, unknown][];
    for (const [key, value] of parsed) {
        // set without loop
        if (Settings.$settings.get(key) === value) continue; // no change
        Settings.$settings.set(key, value);
        Settings.emit('set', [key, value]);
    }
});
