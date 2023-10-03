import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js'
import { log } from "./utilities/terminal-logging.ts";
import { typescript, sveltePlugin } from "./build/esbuild-svelte.ts";
import { EventEmitter } from "./utilities/event-listener.ts";

log('Deno version:', Deno.version.deno);
log('Typescript version:', Deno.version.typescript);
log('V8 version:', Deno.version.v8);


const entries = Array.from(Deno.readDirSync('./client/entries')).map(e => {
    return `./client/entries/${e.name}`;
});

log(entries);

export const builder = new EventEmitter<'build' | 'error'>();

const result = await esbuild.build({
    entryPoints: entries,
    // entryPoints: [
    //     './client/entries/main.ts',
    //     './client/entries/admin.ts',
    //     './client/entries/status.ts',
    //     './client/entries/test.ts'
    //     ],
    bundle: true,
    // minify: true,
    outdir: './dist',
    mainFields: ["svelte", "browser", "module", "main"],
    conditions: ["svelte", "browser"],
    watch: {
        onRebuild(error: Error, result: any) {
            // if (error) console.error(error);
            // else console.log('Build complete', result);

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