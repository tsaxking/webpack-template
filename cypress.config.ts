import { defineConfig } from "cypress";
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import sveltePlugin from "esbuild-svelte";
import { typescript } from "svelte-preprocess-esbuild";
import path from 'path';
import env from './server/utilities/env';




export default defineConfig({
  e2e: {
    setupNodeEvents: (on, config) => {
      on('file:preprocessor', createBundler({                bundle: true,
        minify: env.MINIFY === 'y',
        // outdir: './dist',
        mainFields: ['svelte', 'browser', 'module', 'main'],
        conditions: ['svelte', 'browser'],
        plugins: [
            sveltePlugin({
                preprocess: [
                    typescript({
                        tsconfigRaw: {
                            compilerOptions: {}
                        }
                    })
                ]
            })
        ],
        logLevel: 'info',
        loader: {
            '.png': 'dataurl',
            '.woff': 'dataurl',
            '.woff2': 'dataurl',
            '.eot': 'dataurl',
            '.ttf': 'dataurl',
            '.svg': 'dataurl'
        },
        tsconfig: path.resolve(__dirname, '../tsconfig.json')
      }));
    },
  },
});
