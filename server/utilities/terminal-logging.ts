import { __root } from './env.ts';
import { Colors } from './colors.ts';
import * as blog from 'https://deno.land/x/blog@0.3.3/deps.ts';
import { relative, unify } from './env.ts';

/**
 * Retrieves the callsite information
 * @date 10/12/2023 - 3:26:33 PM
 */
const getSite = () => {
    const site = blog.callsites()[2];
    return {
        filePath: relative(__root, unify(site.getFileName() || '')),
        lineNumber: (site.getLineNumber() || 0) + 1,
        fn: site.getFunctionName() + '()' || 'Global | Unnamed',
    };
};

/**
 * Creates a log message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:33 PM
 */
export const log = (...args: unknown[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(
        Colors.FgGreen,
        `[${filePath}:${lineNumber}]`,
        Colors.FgCyan,
        `[${fn}]`,
        Colors.Reset,
        ...args,
    );
};

/**
 * Creates an error message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:33 PM
 */
export const error = (...args: unknown[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(
        Colors.FgRed,
        `[${filePath}:${lineNumber}] (error)`,
        Colors.FgCyan,
        `[${fn}]`,
        Colors.Reset,
        ...args,
    );
};

/**
 * Creates a warning message, including the file path, line number, and function name
 * @date 10/12/2023 - 3:26:32 PM
 */
export const warn = (...args: unknown[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(
        Colors.FgYellow,
        `[${filePath}:${lineNumber}] (warning)`,
        Colors.FgCyan,
        `[${fn}]`,
        Colors.Reset,
        ...args,
    );
};
