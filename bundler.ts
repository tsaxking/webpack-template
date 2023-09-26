import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js'
import { log } from "./server/utilities/terminal-logging.ts";
import sveltePlugin from 'npm:esbuild-svelte';
// import * as shit from './node_modules/svelte-preprocess-esbuild/dist/index.cjs';

// log(shit);

log('Deno version:', Deno.version.deno);
log('Typescript version:', Deno.version.typescript);
log('V8 version:', Deno.version.v8);


const result = await esbuild.build({
    entryPoints: [
        'client/entries/admin.ts',
        'client/entries/main.ts'
    ],
    bundle: true,
    // minify: true,
    outdir: 'dist',
    watch: {
        onRebuild(error: Error, result: any) {
            if (error) console.error('watch build failed:', error);
            else console.log('watch build succeeded:', result);
        }
    },
    // trust me, it works
    plugins: [(sveltePlugin as unknown as Function)({

    })]
});