import { __root } from './env';
import { Colors } from './colors';
import { dateTime } from '../../shared/clock';
import stack from 'callsite';
import path from 'path';

/**
 * Returns the file path, line number, and function name of the current site
 * @date 3/8/2024 - 5:58:55 AM
 *
 * @returns {{ filePath: any; lineNumber: any; fn: any; }}
 */
const getSite = () => {
    const s = stack()[3];
    return {
        filePath: s.getFileName() || '',
        lineNumber: (s.getLineNumber() || 0) + 1,
        fn: s.getFunctionName() || 'Global | Unnamed'
    };
};

/**
 * Runs a log, error, or warn message
 * @date 3/8/2024 - 5:58:55 AM
 *
 * @param {('log' | 'error' | 'warn')} type
 * @param {...unknown[]} args
 */
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

    console[type](
        color,
        `[${path.relative(__root, filePath)}:${lineNumber}]`,
        Colors.FgCyan,
        `[${fn}]`,
        Colors.FgMagenta,
        `[${d}]`,
        Colors.Reset,
        ...args
    );
};

/**
 * Logs a message
 * @date 3/8/2024 - 5:58:55 AM
 *
 * @param {...unknown[]} args
 */
export const log = (...args: unknown[]) => runLog('log', ...args);
/**
 * Logs an error message
 * @date 3/8/2024 - 5:58:55 AM
 *
 * @param {...unknown[]} args
 */
export const error = (...args: unknown[]) => runLog('error', ...args);
/**
 * Logs a warning message
 * @date 3/8/2024 - 5:58:55 AM
 *
 * @param {...unknown[]} args
 */
export const warn = (...args: unknown[]) => runLog('warn', ...args);
