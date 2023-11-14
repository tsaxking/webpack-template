import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js'
import { log } from "./utilities/terminal-logging.ts";
import { typescript, sveltePlugin } from "./build/esbuild-svelte.ts";
import { EventEmitter } from "../shared/event-emitter.ts";
import { getTemplateSync, saveTemplateSync } from "./utilities/files.ts";
import path from 'node:path';
import env, { __root, __templates } from "./utilities/env.ts";

log('Deno version:', Deno.version.deno);
log('Typescript version:', Deno.version.typescript);
log('V8 version:', Deno.version.v8);

/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:56 PM
 */
const readDir = (dirPath: string): string[] => {
    const entries = Array.from(Deno.readDirSync(dirPath));
    return entries.flatMap(e => {
        if (!e.isFile) return readDir(`${dirPath}/${e.name}`);

        const file = dirPath.split('/').slice(2).join('/') + '/' + e.name.replace('.ts', '.html');

        saveTemplateSync(
            '/' + file,
            getTemplateSync('index', {
                script: path.relative(
                    path.resolve(__templates, file),
                    path.resolve(__root, 'dist', dirPath.split('/').slice(3).join('/'), e.name.replace('.ts', '.js'))
                ),
                style: path.relative(
                    path.resolve(__templates, file),
                    path.resolve(__root, 'dist', dirPath.split('/').slice(3).join('/'), e.name.replace('.ts', '.css'))
                ),
                title: env.TITLE || 'Untitled'
            })
        );

        return `${dirPath}/${e.name}`;
    });
}

/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:56 PM
 *
 * @type {{}}
 */
let entries: string[] = [];

entries = readDir('./client/entries');

/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:56 PM
 *
 * @typedef {BuildEventData}
 */
type BuildEventData = {
    'build': any;
    'error': Error;
};

export const runBuild = async () => {
    const builder = new EventEmitter<keyof BuildEventData>();
    const result = await esbuild.build({
        entryPoints: entries,
        bundle: true,
        // minify: true,
        outdir: './dist',
        mainFields: ["svelte", "browser", "module", "main"],
        conditions: ["svelte", "browser"],
        watch: {
            onRebuild(error: Error, result: any) {
    
                if (error) builder.emit('error', error);
                else builder.emit('build', result);
            }
        },
        // trust me, it works
        plugins: [(sveltePlugin as unknown as Function)({
            preprocess: [
                typescript()
            ]
        })],
        logLevel: "info",
        loader: {
            '.png': 'dataurl',
            '.woff': 'dataurl',
            '.woff2': 'dataurl',
            '.eot': 'dataurl',
            '.ttf': 'dataurl',
            '.svg': 'dataurl',
        }
    });

    builder.on('build', () => entries = readDir('./client/entries'));

    return builder;
}