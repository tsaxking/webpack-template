import { __root } from "./env.ts";
import { Colors } from "./colors.ts";
import * as blog from "https://deno.land/x/blog@0.3.3/deps.ts";
import { relative } from "./env.ts";


/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:33 PM
 */
const getSite = () => {
    const site = blog.callsites()[2];
    return {
        filePath: relative(__root, site.getFileName()?.replace('file://', '').substring(1) || ''),
        lineNumber: (site.getLineNumber() || 0) + 1,
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