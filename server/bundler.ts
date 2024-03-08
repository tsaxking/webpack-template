// This file is responsible for building the client

import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { typescript } from 'svelte-preprocess-esbuild';
// import preprocess from 'svelte-preprocess';
import fs from 'fs';
import path from 'path';
import env, { __entries, __root, __templates } from './utilities/env';
import {
    getTemplate,
    getTemplateSync,
    saveTemplate,
    saveTemplateSync
} from './utilities/files';
import { attempt, attemptAsync } from '../shared/check';
import { EventEmitter } from '../shared/event-emitter';

{
    // clear the dist folder

    attempt(() => fs.rmSync(path.resolve(__root, 'dist'), { recursive: true }));
    attempt(() => fs.mkdirSync(path.resolve(__root, 'dist')));

    // remove the /public/templates/entries folder
    attempt(() =>
        fs.rmSync(path.resolve(__templates, 'entries'), { recursive: true })
    );
    attempt(() => fs.mkdirSync(path.resolve(__templates, 'entries')));
}

/**
 * Reads the directory and returns a shallow array of all the files
 * @date 3/8/2024 - 6:01:24 AM
 *
 * @async
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
const readDir = async (dirPath: string): Promise<string[]> => {
    // console.log('Reading:', dirPath);
    const entries = await fs.promises.readdir(dirPath);
    // console.log('Entries:', entries);

    return (
        await Promise.all(
            entries.map(async e => {
                const fullpath = path.resolve(dirPath, e);

                // if it's a file, save the template then return the path
                if ((await fs.promises.stat(fullpath)).isFile()) {
                    const templateFilePath = path
                        .resolve(
                            __templates,
                            'entries',
                            path.relative(__entries, fullpath)
                        )
                        .replace('.ts', '.html');

                    const index = await getTemplate('index', {
                        script: path
                            .relative(
                                templateFilePath,
                                path.resolve(
                                    __root,
                                    'dist',
                                    path.relative(__entries, fullpath)
                                )
                            )
                            .replace('.ts', '.js'),
                        style: path.relative(
                            templateFilePath,
                            path
                                .resolve(
                                    __root,
                                    'dist',
                                    path.relative(__entries, fullpath)
                                )
                                .replace('.ts', '.css')
                        ),
                        title: env.TITLE || 'Untitled'
                    });
                    if (index.isOk()) {
                        await saveTemplate(templateFilePath, index.value);
                    }
                    return fullpath;
                } else {
                    // if it's a directory, recursively read it
                    return readDir(fullpath);
                }
            })
        )
    ).flat(Infinity) as string[];
};

/**
 * Class for building the client
 * @date 3/8/2024 - 6:01:24 AM
 *
 * @export
 * @class Builder
 * @typedef {Builder}
 */
export class Builder {
    /**
     * A map of all the watchers
     * @date 3/8/2024 - 6:01:24 AM
     *
     * @private
     * @type {*}
     */
    private readonly watchers = new Map<string, fs.FSWatcher>();
    /**
     * If the builder is currently building
     * @date 3/8/2024 - 6:01:24 AM
     *
     * @private
     * @type {boolean}
     */
    private building = false;

    /**
     * Event emitter for the builder
     * @date 3/8/2024 - 6:01:24 AM
     *
     * @public
     * @readonly
     * @type {*}
     */
    public readonly em = new EventEmitter();

    /**
     * Watches a directory for changes
     * @date 3/8/2024 - 6:01:24 AM
     *
     * @param {string} dir
     */
    public watch = (dir: string) => {
        console.log('Watching:', dir);
        const watcher = fs.watch(
            path.resolve(__dirname, '../', dir),
            {
                recursive: true
            },
            (event, _filename) => {
                if (event === 'change' || event === 'rename') {
                    this.build();
                }
            }
        );
        this.watchers.set(dir, watcher);
    };

    /**
     * Closes all the watchers
     * @date 3/8/2024 - 6:01:24 AM
     */
    close = () => {
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
    };

    /**
     * Builds the client
     * @date 3/8/2024 - 6:01:24 AM
     *
     * @returns {*}
     */
    public build = () => {
        return attemptAsync(async () => {
            if (this.building) return;
            this.building = true;
            const dirs = await readDir(__entries);
            const b = await esbuild.build({
                entryPoints: dirs,
                bundle: true,
                minify: env.MINIFY === 'y',
                outdir: './dist',
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
            });
            console.log('Build complete');
            this.em.emit('build');
            this.building = false;
            return b;
        });
    };
}

// if this file is the main file, run the build
if (require.main === module) {
    const builder = new Builder();
    builder
        .build()
        .then(res => {
            if (res.isOk()) process.exit(0);
            console.error(res.error);
            process.exit(1);
        })
        .catch(() => process.exit(1));
}
