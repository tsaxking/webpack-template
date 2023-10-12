import callsite from 'npm:callsite';
import path from 'npm:path';
import { __root } from "./env.ts";
import { Colors } from "./colors.ts";


/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:33 PM
 */
const getSite = () => {
    const site = callsite()[2];
    return {
        filePath: './' + path.relative(__root, site.getFileName().replace('file:', '')),
        lineNumber: site.getLineNumber(),
        fn: site.getFunctionName() + '()' || 'Global | Unnamed'
    }
}



/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:33 PM
 */
export const log = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgGreen, `[${filePath}:${lineNumber}]`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
};

/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:33 PM
 */
export const error = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgRed, `[${filePath}:${lineNumber}] (error)`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:32 PM
 */
export const warn = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgYellow, `[${filePath}:${lineNumber}] (warning)`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
}