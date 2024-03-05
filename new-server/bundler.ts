import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import fs from 'fs';
import path from "path";
import env, { __root, __templates } from "./utilities/env";
import { getTemplateSync, saveTemplate, saveTemplateSync } from "../server/utilities/files";
import { attemptAsync } from "../shared/check";


const readDir = (dirPath: string): string[] => {
    const entries = Array.from(fs.readdirSync(dirPath));

    return entries.flatMap(e => {
        if (fs.statSync(path.resolve(dirPath, e)).isDirectory()) {
            return readDir(path.resolve(dirPath, e));
        }

        const file = dirPath.split('/').slice(2).join('/') + '/' + e.replace('.ts', '.html');

        const result = getTemplateSync('index', {
            script: path.relative(
                path.resolve(__templates, file),
                path.resolve(
                    __root,
                    'dist',
                    dirPath.split('/').slice(3).join('/'),
                    e.replace('.ts', '.js'),
                )
            ),
            style: path.relative(
                path.resolve(__templates, file),
                path.resolve(
                    __root,
                    'dist',
                    dirPath.split('/').slice(3).join('/'),
                    e.replace('.ts', '.css'),
                )
            ),
            title: env.TITLE || 'Untitled'
        });

        if (result.isOk()) {
            saveTemplateSync(
                '/' + file,
                result.value
            );
        }

        return `${dirPath}/${e}`;
    });
}

export class Builder {
    private watchers = new Map<string, fs.FSWatcher>();

    public watch = (dir: string) => {
        const watcher = fs.watch(
            path.resolve(__root, dir)
        );
        this.watchers.set(dir, watcher);

        watcher.on('change', (type, filename) => {
            switch (type) {
                case 'change':
                case 'rename':
                case 'remove':
                case 'add':
                    this.build();
                    break;
            }
        });
    }

    close = () => {
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
    }

    public build = () => {
        return attemptAsync(async() => {
            return esbuild.build({
                entryPoints: readDir('/client/entries'),
                bundle: true,
                minify: env.MINIFY === 'y',
                outdir: './dist',
                mainFields: ['svelte', 'browser', 'module', 'main'],
                conditions: ['svelte', 'browser'],
                plugins: [
                    sveltePlugin()
                ],
                logLevel: 'info',
                loader: {
                    '.png': 'dataurl',
                    '.woff': 'dataurl',
                    '.woff2': 'dataurl',
                    '.eot': 'dataurl',
                    '.ttf': 'dataurl',
                    '.svg': 'dataurl',
                }
            })
        });
    }
}

// if this file is the main file, run the build
if (require.main === module) {
    const builder = new Builder();
    builder.build()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}