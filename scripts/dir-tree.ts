import dirTree from 'directory-tree';
import fs from 'fs';
import path from 'path';

/**
 * Creates a tree structure of the current directory
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @type {*}
 */
const tree = dirTree('./', {
    extensions: /\.(ts|html|js|svelte|json)/,
    exclude: /(node_modules|dist|public\/templates\/entries|.git)/
});

// console.log(tree);

/**
 * File type
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @typedef {File}
 */
type File = {
    path: string;
    name: string;
};

/**
 * Directory type
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @typedef {Directory}
 */
type Directory = File & {
    children: (File | Directory)[];
};

/**
 * Indents a string by a given depth
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @param {number} depth
 * @returns {string}
 */
const indent = (depth: number) => {
    let str = '';
    for (let i = 0; i < depth; i++) {
        str += ' ';
    }
    return str;
};

/**
 * Generates a line for the tree structure
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @param {number} depth
 * @returns {string}
 */
const generateLine = (depth: number) => {
    let str = '|-';
    for (let i = 2; i < depth; i++) {
        str += '-';
    }
    return str;
};

/**
 * Checks if the tree is a directory
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @param {(Directory | File)} tree
 * @returns {tree is Directory}
 */
const isDir = (tree: Directory | File): tree is Directory => 'children' in tree;

/**
 * Creates a string representation of the tree
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @param {(Directory | File)} tree
 * @param {number} depth
 * @param {boolean} _line
 * @returns {string}
 */
const generateStr = (tree: Directory | File, depth: number, _line: boolean) => {
    // generate the tree structure

    let str = '';

    str += `${tree.name}\n`;

    if (isDir(tree)) {
        tree.children.forEach((child, _i) => {
            // console.log(isDir(child));
            // if (isDir(child)) {
            // str += `${generateLine(depth)} ${child.name}\n`;
            // } else {
            const prefix = isDir(child)
                ? indent(depth)
                : ' ' + indent(depth - 1) + generateLine(depth) + ' ';

            str += `\n${prefix}${generateStr(child, depth + 1, true)}`;
            // }
        });
    }

    return str;
};

/**
 * Builds the string representation of the tree
 * @date 3/8/2024 - 6:47:14 AM
 *
 * @type {string}
 */
const str = generateStr(tree, 0, false);

// Deno.writeFileSync('./scripts/dir-tree.txt', new TextEncoder().encode(str));
fs.writeFileSync('./scripts/dir-tree.txt', str);
