import { __root } from './env';
import { Colors } from './colors';
import { dateTime } from '../../shared/clock';
import stack from 'callsite';
import path from 'path';

const getSite = () => {
    const s = stack()[3];
    return {
        filePath: s.getFileName() || '',
        lineNumber: (s.getLineNumber() || 0) + 1,
        fn: s.getFunctionName() || 'Global | Unnamed'
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

export const log = (...args: unknown[]) => runLog('log', ...args);
export const error = (...args: unknown[]) => runLog('error', ...args);
export const warn = (...args: unknown[]) => runLog('warn', ...args);
