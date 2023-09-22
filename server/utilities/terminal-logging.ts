import callsite from 'npm:callsite';
import path from 'npm:path';
import { __root } from "./env.ts";
import { Colors } from "./colors.ts";



export const log = (...args: any[]) => {
    // get relative file path from __root
    const site = callsite()[1];
    const filePath = './' + path.relative(__root, site.getFileName().replace('file:', ''));
    const lineNumber = site.getLineNumber();
    const fn = site.getFunctionName() || 'Global | Unnamed';

    console.log(Colors.FgGreen, `[${filePath}:${lineNumber}]`, Colors.FgRed, `[${fn}]`, Colors.Reset, ...args);
};