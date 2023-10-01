import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js'
import { log } from "./utilities/terminal-logging.ts";
import { typescript, sveltePlugin } from "./build/esbuild-svelte.ts";

log('Deno version:', Deno.version.deno);
log('Typescript version:', Deno.version.typescript);
log('V8 version:', Deno.version.v8);

const result = await esbuild.build({
    entryPoints: [
        'client/entries/admin.ts',
        'client/entries/main.ts',
        'client/entries/test.ts'
    ],
    bundle: true,
    minify: true,
    outdir: 'dist',
    mainFields: ["svelte", "browser", "module", "main"],
    conditions: ["svelte", "browser"],
    watch: {
        onRebuild(error: Error, result: any) {
            if (error) console.error('watch build failed:', error);
            else console.log('watch build succeeded:', result);
        }
    },
    // trust me, it works
    plugins: [(sveltePlugin as unknown as Function)({
        preprocess: [
            typescript()
        ]
    })],
    logLevel: "info"
});