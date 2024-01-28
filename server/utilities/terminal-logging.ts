import { __root } from './env.ts';
import { Colors } from './colors.ts';
import * as blog from 'https://deno.land/x/blog@0.3.3/deps.ts';
import { relative, unify } from './env.ts';
import { log as toCsv } from './files.ts';
import { dateTime } from '../../shared/clock.ts';

/**
 * Retrieves the callsite information
 * @date 10/12/2023 - 3:26:33 PM
 */
const getSite = () => {
    const site = blog.callsites()[3];
    const p = site.getFileName() || '';
    return {
        filePath: relative(__root, unify(site.getFileName() || '')),
        lineNumber: (site.getLineNumber() || 0) + 1,
        fn: site.getFunctionName() + '()' || 'Global | Unnamed',
    };
};

const runLog = (type: 'log' | 'error' | 'warn', ...args: unknown[]) => {
    let color = Colors.FgGreen;
    switch (type) {
        case 'log':
            color = Colors.FgGreen;
            break;
        case 'error':
            color = Colors.FgRed;
            break;
        case 'warn':
            color = Colors.FgYellow;
            break;
        default:
            break;
    }

    const { filePath, lineNumber, fn } = getSite();

    const d = dateTime();

    if (!Deno.args.includes('--no-console')) {
        console[type](
            color,
            `[${filePath}:${lineNumber}]`,
            // Colors.FgMagenta,
            // `[${d}]`,
            Colors.FgCyan,
            `[${fn}]`,
            Colors.Reset,
            ...args,
        );
    }

    if (Deno.args.includes('--console-to-csv')) {
        toCsv('console', {
            type,
            date: d,
            file: filePath,
            line: lineNumber,
            fn,
            args: args ? JSON.stringify(args) : '',
        });
    }
};

/**
 * Creates a log message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:33 PM
 */
export const log = (...args: unknown[]) => runLog('log', ...args);

/**
 * Creates an error message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:33 PM
 */
export const error = (...args: unknown[]) => runLog('error', ...args);

/**
 * Creates a warning message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:32 PM
 */
export const warn = (...args: unknown[]) => runLog('warn', ...args);
