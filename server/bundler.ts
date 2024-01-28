/* eslint-disable @typescript-eslint/no-explicit-any */
// this needs to be upgraded, but esbuild has not integrated "watch" yet
import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js';
import { sveltePlugin, typescript } from './build/esbuild-svelte.ts';
import { EventEmitter } from '../shared/event-emitter.ts';
import { getTemplateSync, saveTemplateSync } from './utilities/files.ts';
import { minify } from 'npm:minify';

import env, {
    __root,
    __templates,
    relative,
    resolve,
} from './utilities/env.ts';
import { stdin } from './utilities/utilties.ts';

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
 * Event data for the build event
 * @date 10/12/2023 - 3:26:56 PM
 *
 * @typedef {BuildEventData}
 */
type BuildEventData = {
    'build': void;
    'error': Error;
    'minify': void;
};

export const runBuild = async () => {
    let entries: string[] = readDir('./client/entries');
    const builder = new EventEmitter<keyof BuildEventData>();

    await esbuild.build({
        entryPoints: entries,
        bundle: true,
        // minify: Deno.args.includes('--minify'),
        outdir: './dist',
        mainFields: ['svelte', 'browser', 'module', 'main'],
        conditions: ['svelte', 'browser'],
        watch: {
            onRebuild(error: Error, result: any) {
                if (error) builder.emit('error', error);
                else builder.emit('build', result);
            },
        },
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

    builder.on('build', async () => {
        console.log('Built!');
        if (Deno.args.includes('minify')) {
            console.log('minifying...');
            // await Promise.all(
            //     entries.map((entry) =>                 
            //         minify(entry, {
            //             js: {
            //                 removeUnusedVariables: true,
            //                 removeConsole: true,
            //                 removeUselessSpread: true
            //             },
            //             html: {
            //                 removeComments: true,
            //                 removeEmptyAttributes: true,
            //                 removeRedundantAttributes: true,
            //                 removeScriptTypeAttributes: true,
            //                 removeStyleLinkTypeAttributes: true,
            //                 removeOptionalTags: true,
            //             },
            //             css: {
            //                 compatibility: '*',
            //             }
            //         })
            //     )
            // )
        }
    });

    stdin.on('rb', () => entries = readDir('./client/entries'));

    builder.emit('build');

    console.log('Watching for changes...');

    return builder;
};

// if this file is the main file, run the build
if (import.meta.main) {
    runBuild()
        .then(() => Deno.exit(0))
        .catch(() => Deno.exit(1));
}
