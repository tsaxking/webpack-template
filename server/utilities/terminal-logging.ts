import callsite from 'npm:callsite';
import path from 'npm:path';
import { __root } from "./env.ts";
import { Colors } from "./colors.ts";


const getSite = () => {
    const site = callsite()[2];
    return {
        filePath: './' + path.relative(__root, site.getFileName().replace('file:', '')),
        lineNumber: site.getLineNumber(),
        fn: site.getFunctionName() + '()' || 'Global | Unnamed'
    }
}



export const log = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgGreen, `[${filePath}:${lineNumber}]`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
};

export const error = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgRed, `[${filePath}:${lineNumber}] (error)`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
}

export const warn = (...args: any[]) => {
    const { filePath, lineNumber, fn } = getSite();
    console.log(Colors.FgYellow, `[${filePath}:${lineNumber}] (warning)`, Colors.FgCyan, `[${fn}]`, Colors.Reset, ...args);
}