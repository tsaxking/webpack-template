import FuzzySearch from 'fuzzy-search';
import { Colors } from '../server/utilities/colors';
import { attemptAsync, Result } from '../shared/check';
import prompts from 'prompts';
// import {choose} from '@putout/cli-choose';

export const prompt = async (message: string): Promise<string> => {
    const res = await prompts({
        type: 'text',
        name: 'value',
        message: message
    });

    return res.value;
};

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

type Option<T = unknown> = {
    name: string;
    value: T;
};

const _select = async <T = unknown>(
    message: string,
    options: Option<T>[]
): Promise<T> => {
    const res = await new Promise<T>(res => {
        const run = (selected: number) => {
            console.clear();
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

export const select = async <T = unknown>(
    message: string,
    data: (Option<T> | string)[],
    options: {
        exit?: boolean;
        return?: boolean;
    } = {
        exit: false
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
        )
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

export const confirm = async (message = 'Confirm'): Promise<boolean> => {
    return (await select(message, ['Yes', 'No'])) === 'Yes';
};

export const search = async <T extends string | Option>(
    message: string,
    options: (
        | {
              name: string;
              value: T;
          }
        | T
    )[]
): Promise<Result<string>> => {
    const s = new FuzzySearch(options, ['name', ''], {
        caseSensitive: false
    });

    const run = async (): Promise<Result<string>> => {
        return attemptAsync(async () => {
            const data = await prompt(
                `${Colors.FgCyan}? ${Colors.Reset} ${message}`
            );

            const values = s.search(data || '');

            const res = await select<string>('Select a value', [
                {
                    name: '[Back to search]',
                    value: '$$back$$'
                },
                {
                    name: '[Exit search]',
                    value: '$$exit$$'
                },
                ...values.map(v =>
                    typeof v === 'string' ? v : v.name || v.toString()
                )
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
