/* eslint-disable @typescript-eslint/no-explicit-any */
// this needs to be upgraded, but esbuild has not integrated "watch" yet
import * as esbuild from 'https://deno.land/x/esbuild@v0.20.0/mod.js';
import { sveltePlugin, typescript } from './build/esbuild-svelte.ts';
import { EventEmitter } from '../shared/event-emitter.ts';
import { getTemplateSync, saveTemplateSync } from './utilities/files.ts';

import env, {
    __root,
    __templates,
    relative,
    resolve,
} from './utilities/env.ts';

/**
 * Recursively reads a directory, saves the template, and returns the file paths
 * @date 10/12/2023 - 3:26:56 PM
 */
const readDir = (dirPath: string): string[] => {
    const entries = Array.from(Deno.readDirSync(dirPath));
    return entries.flatMap((e) => {
        if (!e.isFile) return readDir(`${dirPath}/${e.name}`);

        const file = dirPath.split('/').slice(2).join('/') +
            '/' +
            e.name.replace('.ts', '.html');

        const result = getTemplateSync('index', {
            script: relative(
                resolve(__templates, file),
                resolve(
                    __root,
                    'dist',
                    dirPath.split('/').slice(3).join('/'),
                    e.name.replace('.ts', '.js'),
                ),
            ),
            style: relative(
                resolve(__templates, file),
                resolve(
                    __root,
                    'dist',
                    dirPath.split('/').slice(3).join('/'),
                    e.name.replace('.ts', '.css'),
                ),
            ),
            title: env.TITLE || 'Untitled',
        });

        if (result.isOk()) {
            saveTemplateSync('/' + file, result.value);
        }
        return `${dirPath}/${e.name}`;
    });
};

/**
 * All entry points to the front end app
 * @date 10/12/2023 - 3:26:56 PM
 *
 * @type {{}}
 */
let entries: string[] = readDir('./client/entries');

/**
 * Event data for the build event
 * @date 10/12/2023 - 3:26:56 PM
 *
 * @typedef {BuildEventData}
 */
type BuildEventData = {
    build: any;
    error: Error;
};

export const runBuild = async () => {
    const builder = new EventEmitter<keyof BuildEventData>();

    const watch = async (path: string) => {
        const watcher = Deno.watchFs(path);
        for await (const event of watcher) {
            console.log('file change detected', event);
            switch (event.kind) {
                case 'create':
                case 'modify':
                case 'remove':
                    entries = readDir('./client/entries');
                    build();
                    break;
            }
        }
    };

    const build = () =>
        esbuild.build({
            entryPoints: entries,
            bundle: true,
            // minify: true,
            outdir: './dist',
            mainFields: ['svelte', 'browser', 'module', 'main'],
            conditions: ['svelte', 'browser'],
            // watch: {
            //     onRebuild(error: Error, result: any) {
            //         if (error) builder.emit('error', error);
            //         else builder.emit('build', result);
            //     },
            // },
            // trust me, it works
            plugins: [
                (sveltePlugin as any)({
                    preprocess: [typescript()],
                }),
            ],
            logLevel: 'info',
            loader: {
                '.png': 'dataurl',
                '.woff': 'dataurl',
                '.woff2': 'dataurl',
                '.eot': 'dataurl',
                '.ttf': 'dataurl',
                '.svg': 'dataurl',
            },
        });

    builder.on('build', () => {
        entries = readDir('./client/entries');
        build();
    });

    await build();

    if (Deno.args.includes('--watch')) {
        watch('./client');
        watch('./shared');
    }

    return builder;
};

// if this file is the main file, run the build
if (import.meta.main) {
    runBuild()
        .then(() => Deno.exit(0))
        .catch(() => Deno.exit(1));
}
