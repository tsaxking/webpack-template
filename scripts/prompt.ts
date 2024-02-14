import * as cliffy from 'https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/select.ts';
import FuzzySearch from 'npm:fuzzy-search';
import { Colors } from '../server/utilities/colors.ts';
import { attemptAsync, Result } from '../shared/check.ts';

export const repeatPrompt = (
    message: string,
    original?: string,
    validate?: (data: string) => boolean,
    allowBlank = false,
): string => {
    if (!original) original = message;
    const i = prompt(message + ':');

    if (i === null) {
        throw new Error('exit');
    }

    if (!i && allowBlank) return '';
    if (!i) {
        return repeatPrompt(
            'Please enter value (' + original + ')',
            original,
            validate,
            allowBlank,
        );
    }
    if (validate && !validate(i)) {
        return repeatPrompt(
            'Invalid value (' + original + ')',
            original,
            validate,
            allowBlank,
        );
    }
    return i;
};

type Option<T = unknown> = {
    name: string;
    value: T;
};

export const select = async <T = unknown>(
    message: string,
    data: (Option<T> | string)[],
    options: {
        exit?: boolean;
        return?: boolean;
    } = {
        exit: false,
    },
): Promise<T> => {
    if (options.return) {
        data.push({
            name: 'Return',
            value: '$$return$$' as unknown as T,
        });
    }
    if (options.exit) {
        data.push({
            name: 'Exit',
            value: '$$exit$$' as unknown as T,
        });
    }
    const res = await cliffy.Select.prompt({
        message: message,
        options: data,
    });

    if (res === '$$exit$$') {
        if (options.exit) {
            Deno.exit(0);
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

export const search = async <T>(
    message: string,
    options: (
        | {
            name: string;
            value: T;
        }
        | T
    )[],
): Promise<Result<string>> => {
    const s = new FuzzySearch(options, ['name', ''], {
        caseSensitive: false,
    });

    const run = async (): Promise<Result<string>> => {
        return attemptAsync(async () => {
            const data = prompt(`${Colors.FgCyan}? ${Colors.Reset} ${message}`);

            const values = s.search(data);

            const res = await select<string>('Select a value', [
                {
                    name: '[Back to search]',
                    value: '$$back$$',
                },
                {
                    name: '[Exit search]',
                    value: '$$exit$$',
                },
                ...values.map((v) => v.name || v.toString()),
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
