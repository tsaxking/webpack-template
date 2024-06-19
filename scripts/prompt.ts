import FuzzySearch from 'fuzzy-search';
import { Colors } from '../server/utilities/colors';
import { attemptAsync, Result } from '../shared/check';
import prompts from 'prompts';
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
    const res = await prompts({
        type: 'text',
        name: 'value',
        message: message
    });

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
        const run = (selected: number) => {
            if (clear) console.clear();
            console.log(Colors.FgBlue, '?', Colors.Reset, message, '\n');
            for (let i = 0; i < options.length; i++) {
                const o = options[i];
                console.log(
                    Colors.FgGreen,
                    i === selected ? '>' : ' ',
                    Colors.Reset,
                    o.name
                );
            }

            stdin.on('data', handleKey);
        };

        let selected = 0;

        const stdin = process.stdin;

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

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
                else throw res.error;
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
