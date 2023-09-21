import * as esbuild from 'https://deno.land/x/esbuild@v0.11.12/mod.js'




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
    }
});