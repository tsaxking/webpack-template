import dirTree from 'npm:directory-tree';

const tree = dirTree('./', {
    extensions: /\.(ts|html|js|svelte|json)/,
    exclude: /(node_modules|dist|public\/templates\/entries|.git)/,
});

// console.log(tree);

type File = {
    path: string;
    name: string;
};

type Directory = File & {
    children: (File | Directory)[];
};

const indent = (depth: number) => {
    let str = '';
    for (let i = 0; i < depth; i++) {
        str += ' ';
    }
    return str;
};

const generateLine = (depth: number) => {
    let str = '|-';
    for (let i = 2; i < depth; i++) {
        str += '-';
    }
    return str;
};

const isDir = (tree: Directory | File): tree is Directory => 'children' in tree;

const generateStr = (tree: Directory | File, depth: number, line: boolean) => {
    // generate the tree structure

    let str = '';

    str += `${tree.name}\n`;

    if (isDir(tree)) {
        tree.children.forEach((child, i) => {
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

const str = generateStr(tree, 0, false);

Deno.writeFileSync('./scripts/dir-tree.txt', new TextEncoder().encode(str));
