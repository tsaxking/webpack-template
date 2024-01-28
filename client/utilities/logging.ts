import { env } from './env';
import { dateTime } from '../../shared/clock';
import { ServerRequest } from './requests';

const runLog = (type: 'log' | 'error' | 'warn', ...args: unknown[]) => {
    const d = dateTime();

    if (env.ENVIRONMENT === 'dev') {
        console[type](`[${d}]`, ...args);

        if (type === 'error') {
            ServerRequest.post('/error', {
                type,
                date: d,
                args: args ? JSON.stringify(args) : '',
            });
        }
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
