import FuzzySearch from 'fuzzy-search';
import { Colors } from '../server/utilities/colors';
import { attemptAsync, Result } from '../shared/check';
import prompts from 'prompts';
import Table from 'cli-table';
// import chalk from 'chalk';
// import {choose} from '@putout/cli-choose';

/**
 * Prompts the user for input
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @param {string} message
 * @returns {Promise<string>}
 */
export const prompt = async (message: string): Promise<string> => {
    const stdin = process.stdin as unknown as NodeJS.ReadStream & {
        off: (event: string, listener: (key: string) => void) => void;
    };

    // listen for ctrl c
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (key: string) => {
        if (key === '\u0003') {
            // ctrl + c
            process.exit();
        }
    };

    stdin.on('data', onData);
    const res = await prompts({
        type: 'text',
        name: 'value',
        message: message
    });

    stdin.off('data', onData);
    return res.value;
};

/**
 * Prompts the user for input, repeating until the input is valid
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @param {string} message
 * @param {?string} [original]
 * @param {?(data: string) => boolean} [validate]
 * @param {boolean} [allowBlank=false]
 * @returns {Promise<string>}
 */
export const repeatPrompt = async (
    message: string,
    original?: string,
    validate?: (data: string) => boolean,
    allowBlank = false
): Promise<string> => {
    if (!original) original = message;

    const i = await prompt(message + ':');

    if (i === null) {
        throw new Error('exit');
    }

    if (!i && allowBlank) return '';
    if (!i) {
        return repeatPrompt(
            'Please enter value (' + original + ')',
            original,
            validate,
            allowBlank
        );
    }
    if (validate && !validate(i)) {
        return repeatPrompt(
            'Invalid value (' + original + ')',
            original,
            validate,
            allowBlank
        );
    }

    return i;
};

/**
 * Option for selection
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @typedef {Option}
 * @template [T=unknown]
 */
type Option<T = unknown> = {
    name: string;
    value: T;
};

/**
 * Selects an option from a list (wrapper function since I'm still working on the select function in the cli-choose package)
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @template [T=unknown]
 * @param {string} message
 * @param {Option<T>[]} options
 * @returns {Promise<T>}
 */
const _select = async <T = unknown>(
    message: string,
    options: Option<T>[],
    clear = true
): Promise<T> => {
    const res = await new Promise<T>(res => {
        let selected = 0;

        const stdin = process.stdin as unknown as NodeJS.ReadStream & {
            off: (event: string, listener: (key: string) => void) => void;
        };

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        const run = (selected: number) => {
            if (clear) console.clear();
            console.log(Colors.FgBlue, '?', Colors.Reset, message, '\n');
            for (let i = 0; i < options.length; i++) {
                const o = options[i];
                console.log(
                    i === selected ? Colors.FgGreen : '',
                    o.name,
                    Colors.Reset
                );
            }

            stdin.on('data', handleKey);
        };

        const handleKey = (key: string) => {
            if (key === '\u0003') {
                process.exit();
            } else if (key === '\r') {
                stdin.setRawMode(false);
                stdin.pause();
                console.log('\n');
                res(options[selected].value);
            } else if (key === '\u001b[A') {
                selected = selected === 0 ? options.length - 1 : selected - 1;
                run(selected);
            } else if (key === '\u001b[B') {
                selected = selected === options.length - 1 ? 0 : selected + 1;
                run(selected);
            } else {
                return;
            }

            stdin.off('data', handleKey);
        };

        run(selected);
    });

    return res;
};

/**
 * Selects an option from a list
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @template [T=unknown]
 * @param {string} message
 * @param {(Option<T> | string)[]} data
 * @param {{
 *         exit?: boolean;
 *         return?: boolean;
 *     }} [options={
 *         exit: false
 *     }]
 * @returns {Promise<T>}
 */
export const select = async <T = unknown>(
    message: string,
    data: (Option<T> | string)[],
    options: {
        exit?: boolean;
        return?: boolean;
        clear?: boolean;
    } = {
        exit: false,
        clear: true
    }
): Promise<T> => {
    if (options.return) {
        data.push({
            name: 'Return',
            value: '$$return$$' as unknown as T
        });
    }
    if (options.exit) {
        data.push({
            name: 'Exit',
            value: '$$exit$$' as unknown as T
        });
    }

    const res = await _select(
        message,
        data.map(d =>
            typeof d === 'string' ? ({ name: d, value: d } as Option<T>) : d
        ),
        options.clear
    );

    if (res === '$$exit$$') {
        if (options.exit) {
            process.exit(0);
        }
        throw new Error('exit');
    }

    if (res === '$$return$$') {
        throw new Error('return');
    }

    return res as T;
};

export const multiSelect = async <T = unknown>(
    message: string,
    data: string[]
) => {
    return new Promise<number[]>((res, rej) => {
        const result: number[] = [];
        let hovering = 0;

        const stdin = process.stdin as unknown as NodeJS.ReadStream & {
            off: (event: string, listener: (key: string) => void) => void;
        };

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        const run = () => {
            console.clear();
            console.log(message);
            console.log('Use arrow keys to navigate');
            console.log('Space to select and deselect');
            console.log('Enter to finish selection\n');
            for (let i = 0; i < data.length; i++) {
                const o = data[i];
                console.log(
                    result.includes(i) ? '✔️' : ' ',
                    i === hovering ? '>' : ' ', // do I want chalk?
                    o
                );
            }

            stdin.on('data', handleKey);
        };

        const handleKey = (key: string) => {
            if (key === '\u0003') {
                // Ctrl + C
                process.exit();
            } else if (key === '\r') {
                // Enter
                stdin.setRawMode(false);
                stdin.pause();
                console.log('\n');
                res(result);
            } else if (key === '\u001b[A') {
                // Up
                hovering++;
                if (hovering >= data.length) hovering = 0;
                run();
            } else if (key === '\u001b[B') {
                // Down
                hovering--;
                if (hovering < 0) hovering = data.length - 1;
                run();
            } else if (key === ' ') {
                // Space
                if (result.includes(hovering)) {
                    result.splice(result.indexOf(hovering), 1);
                } else {
                    result.push(hovering);
                }
                run();
            }

            stdin.off('data', handleKey);
        };

        run();
    });
};

/**
 * Confirms a message
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @param {string} [message='Confirm']
 * @returns {Promise<boolean>}
 */
export const confirm = async (message = 'Confirm'): Promise<boolean> => {
    return (await select(message, ['Yes', 'No'])) === 'Yes';
};

/**
 * Searches for a value in a list (fuzzy search)
 * @date 3/8/2024 - 6:52:57 AM
 *
 * @async
 * @template {string | Option} T
 * @param {string} message
 * @param {(
 *         | {
 *               name: string;
 *               value: T;
 *           }
 *         | T
 *     )[]} options
 * @returns {Promise<Result<string>>}
 */
export const search = async <T extends string | Option>(
    message: string,
    options: (
        | {
              name: string;
              value: T;
          }
        | T
    )[]
): Promise<Result<T>> => {
    const s = new FuzzySearch(options, ['name', ''], {
        caseSensitive: false
    });

    const run = async (): Promise<Result<T>> => {
        return attemptAsync(async () => {
            const data = await prompt(
                `${Colors.FgCyan}? ${Colors.Reset} ${message}`
            );

            const values = s.search(data || '');

            const res = await select<T>('Select a value', [
                {
                    name: '[Back to search]',
                    value: '$$back$$' as T
                },
                {
                    name: '[Exit search]',
                    value: '$$exit$$' as T
                },
                ...values.map(v => ({
                    name: typeof v === 'string' ? v : v.name || v.toString(),
                    value: typeof v === 'string' ? v : (v.value as T)
                }))
            ]);

            if (res === '$$back$$') {
                const res = await run();
                if (res.isOk()) return res.value;
                throw res.error;
            }

            if (res === '$$exit$$') {
                throw new Error('exit');
            }

            console.log(res);

            return res;
        });
    };

    return run();
};

export const selectTable = <T extends Record<string, unknown>>(
    message: string,
    data: T[],
    options?: {
        omit?: (keyof T)[];
        goBack?: (message: string) => void;
        // exit?: boolean;
        // return?: boolean;
    }
) => {
    return new Promise<T | undefined>((res, rej) => {
        if (!data.length) {
            console.log('No data to select from');
            return res(undefined);
        }

        const headers = Object.keys(data[0]).filter(
            h => !options?.omit?.includes(h)
        );

        const stdin = process.stdin as unknown as NodeJS.ReadStream & {
            off: (event: string, listener: (key: string) => void) => void;
        };

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let selected = 0;

        const run = (selected: number) => {
            console.clear();
            console.log(message);
            const t = new Table({
                head: headers
            });

            t.push(
                ...data.map((o, i) =>
                    headers.map(h => {
                        if (i === selected) {
                            return `${Colors.FgBlue}${o[h]}${Colors.Reset}`;
                        }
                        return String(o[h]);
                    })
                )
            );

            console.log(t.toString());

            stdin.on('data', handleKey);
        };

        const handleKey = (key: string) => {
            switch (key) {
                case '\u0003':
                    process.exit();
                    break;
                case '\r':
                    console.clear();
                    res(data[selected]);
                    break;
                case '\u001b[A':
                    selected = selected === 0 ? data.length - 1 : selected - 1;
                    run(selected);
                    break;
                case '\u001b[B':
                    selected = selected === data.length - 1 ? 0 : selected + 1;
                    run(selected);
                    break;
            }

            stdin.off('data', handleKey);
        };

        run(0);
    });
};
