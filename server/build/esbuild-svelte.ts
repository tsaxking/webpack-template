/* eslint-disable @typescript-eslint/no-explicit-any */
// ignore in deno.json compiler
// deno-lint-ignore-file no-explicit-any

import { existsSync as exists, readFileSync as read, statSync } from 'node:fs';
import esbuild from 'npm:esbuild';
import { error, warn } from '../utilities/terminal-logging.ts';
import { compile, preprocess, VERSION } from 'npm:svelte@3.39.0/compiler';
import { originalPositionFor, TraceMap } from 'npm:@jridgewell/trace-mapping';
import {
    __dirname as cwd,
    basename,
    dirname,
    relative,
    resolve,
} from '../utilities/env.ts';

const isExternal = /^(https?:)?\/\//;
const isString = (x: any) => typeof x === 'string';

const isTypescript = (attrs: any): boolean => {
    if (isString(attrs.lang)) {
        return /^(ts|typescript)$/.test(attrs.lang);
    }
    if (isString(attrs.type)) {
        return /^(text|application)[/](ts|typescript)$/.test(attrs.type);
    }
    if (isString(attrs.src)) {
        return /\.ts$/.test(attrs.src);
    }

    return false;
};

const bail = (err: Error, ...args: any[]) => {
    error(...args);
    error(err);
    Deno.exit(1);
};

const transform = async (input: any, options: any) => {
    let config = options;
    const deps: any[] = [];

    if (input.filename) {
        let src = input.attributes.src;
        config = { ...config, sourcefile: input.filename };
        if (isString(src) && !isExternal.test(src)) {
            src = resolve(dirname(input.filename), src);
            if (exists(src)) {
                input.content = read(src, 'utf8');
                deps.push(src);
            } else {
                warn('Could not find file:', src);
            }
        }
    }

    const output = await esbuild.transform(input.content, config);
    if (output.warnings.length) {
        warn(...output.warnings);
    }
    return {
        code: output.code,
        dependencies: deps,
        map: output.map,
    };
};

export const typescript = (options: any = {}) => {
    const { tsconfig, logLevel = 'error' } = options;
    let { ...config } = options;
    config = {
        charset: 'utf8',
        logLevel,
        sourcemap: true,
        ...config,
        loader: 'ts',
        format: 'esm',
        minify: false,
        logLimit: 0,
    };

    let contents;
    if (config.tsconfigRaw) {
        contents = config.tsconfigRaw;
    } else {
        const file = resolve(tsconfig || './tsconfig.json');
        try {
            contents = JSON.parse(read(file, 'utf8'));
        } catch (err) {
            if (err.code !== 'ENOENT') {
                bail(err, 'Could not read tsconfig file');
            }
            if (tsconfig) {
                bail(err, 'Could not read tsconfig file:', tsconfig);
            }
            // warn(
            //     'Attempt to autoload "tsconfig.json" failed. Using default options.',
            // );
            contents = { extends: true };
        }
    }

    if (!contents.compilerOptions && !contents.extends) {
        warn('No compilerOptions found in tsconfig.json');
    }

    const compilerOptions = { ...contents.compilerOptions };
    compilerOptions.importsNotUsedAsValues = 'preserve';
    compilerOptions.preserveValueImports = true;
    config.tsconfigRaw = { compilerOptions };
    const define = config.define || {};
    return {
        async script(input: any) {
            const bool = isTypescript(input.attributes);
            if (!bool && define) {
                return transform(input, { define, loader: 'js' });
            }
            if (!bool) {
                return { code: input.content };
            }
            return transform(input, config);
        },
    };
};

export const replace = (define: any = {}) => {
    for (const key in define) {
        define[key] = String(define[key]);
    }
    return {
        async script(input: any) {
            const bool = isTypescript(input.attributes);
            if (bool) return { code: input.content };
            return transform(input, { define, loader: 'js' });
        },
    };
};

async function convertMessage(
    { message, start, end }: any,
    filename: string,
    source: string,
    sourcemap: any,
) {
    let location;
    if (start && end) {
        const lineText = source.split(/\r\n|\r|\n/g)[start.line - 1];
        const lineEnd = start.line === end.line ? end.column : lineText.length;
        if (sourcemap) {
            sourcemap = new TraceMap(sourcemap);
            const pos = originalPositionFor(sourcemap, {
                line: start.line,
                column: start.column,
            });
            if (pos.source) {
                start.line = pos.line ?? start.line;
                start.column = pos.column ?? start.column;
            }
        }
        location = {
            file: filename,
            line: start.line,
            column: start.column,
            length: lineEnd - start.column,
            lineText,
        };
    }
    return { text: message, location };
}
const shouldCache = (build: any) => {
    let _a, _b;
    return (
        ((_a = build.initialOptions) == null ? void 0 : _a.incremental) ||
        ((_b = build.initialOptions) == null ? void 0 : _b.watch)
    );
};
//   const b64enc = Buffer ? (b: any) => Buffer.from(b).toString("base64") : (b: any) => btoa(encodeURIComponent(b));

const b64enc = (b: any) => btoa(encodeURIComponent(b));

function toUrl(data: any) {
    return 'data:application/json;charset=utf-8;base64,' + b64enc(data);
}
const SVELTE_FILTER = /\.svelte$/;
const FAKE_CSS_FILTER = /\.esbuild-svelte-fake-css$/;
export function sveltePlugin(options: any) {
    const svelteFilter = (options == null ? void 0 : options.include) ??
        SVELTE_FILTER;
    const svelteVersion = VERSION.split('.').map((v: any) => parseInt(v))[0];
    return {
        name: 'esbuild-svelte',
        setup(build: any) {
            if (!options) {
                options = {};
            }
            if (options.cache == void 0 && shouldCache(build)) {
                options.cache = true;
            }
            if (options.fromEntryFile == void 0) {
                options.fromEntryFile = false;
            }
            if (options.filterWarnings == void 0) {
                options.filterWarnings = () => true;
            }
            const cssCode = /* @__PURE__ */ new Map();
            const fileCache = /* @__PURE__ */ new Map();
            build.onResolve({ filter: svelteFilter }, ({ path, kind }: any) => {
                if (
                    kind === 'entry-point' &&
                    (options == null ? void 0 : options.fromEntryFile)
                ) {
                    return { path, namespace: 'esbuild-svelte-direct-import' };
                }
            });
            build.onLoad(
                {
                    filter: svelteFilter,
                    namespace: 'esbuild-svelte-direct-import',
                },
                async (_args: unknown) => {
                    return {
                        errors: [
                            {
                                text:
                                    'esbuild-svelte does not support creating entry files yet',
                            },
                        ],
                    };
                },
            );
            build.onLoad({ filter: svelteFilter }, async (args: any) => {
                let _a, _b, _c;
                let cachedFile: any = null;
                let previousWatchFiles: any = [];
                if (
                    (options == null ? void 0 : options.cache) === true &&
                    fileCache.has(args.path)
                ) {
                    cachedFile = fileCache.get(args.path) || {
                        dependencies: /* @__PURE__ */ new Map(),
                        data: null,
                    };
                    let cacheValid = true;
                    try {
                        cachedFile.dependencies.forEach(
                            (time: any, path: any) => {
                                if (statSync(path).mtime > time) {
                                    cacheValid = false;
                                }
                            },
                        );
                    } catch {
                        cacheValid = false;
                    }
                    if (cacheValid) {
                        return cachedFile.data;
                    } else {
                        fileCache.delete(args.path);
                    }
                }
                const originalSource = read(args.path, 'utf8');
                const filename = relative(cwd(), args.path);
                const dependencyModifcationTimes = /* @__PURE__ */ new Map();
                dependencyModifcationTimes.set(
                    args.path,
                    statSync(args.path).mtime,
                );
                const compilerOptions = {
                    css: svelteVersion < 3 ? false : 'external',
                    ...(options == null ? void 0 : options.compilerOptions),
                };
                try {
                    let source = originalSource;
                    if (options == null ? void 0 : options.preprocess) {
                        let preprocessResult: any = null;
                        try {
                            preprocessResult = (await preprocess(
                                originalSource,
                                options.preprocess,
                                {
                                    filename,
                                },
                            )) as any;
                        } catch (e) {
                            if (cachedFile) {
                                previousWatchFiles = Array.from(
                                    cachedFile.dependencies.keys(),
                                );
                            }
                            throw e;
                        }
                        if (preprocessResult.map) {
                            const fixedMap: any = preprocessResult.map;
                            for (
                                let index = 0;
                                index <
                                    (fixedMap == null
                                        ? void 0
                                        : fixedMap.sources.length);
                                index++
                            ) {
                                if (fixedMap.sources[index] == filename) {
                                    fixedMap.sources[index] = basename(
                                        filename,
                                    );
                                }
                            }
                            compilerOptions.sourcemap = fixedMap;
                        }
                        source = preprocessResult.code;
                        if (
                            (options == null ? void 0 : options.cache) === true
                        ) {
                            (_a = preprocessResult.dependencies) == null
                                ? void 0
                                : _a.forEach((entry: any) => {
                                    dependencyModifcationTimes.set(
                                        entry,
                                        statSync(entry).mtime,
                                    );
                                });
                        }
                    }
                    const { js, css, ...rest } = compile(source, {
                        ...compilerOptions,
                        filename,
                    });

                    let { warnings } = rest;

                    if (compilerOptions.sourcemap) {
                        if (js.map.sourcesContent == void 0) {
                            js.map.sourcesContent = [];
                        }
                        for (
                            let index = 0;
                            index < js.map.sources.length;
                            index++
                        ) {
                            const element = js.map.sources[index];
                            if (element == basename(filename)) {
                                js.map.sourcesContent[index] = originalSource;
                                index = Infinity;
                            }
                        }
                    }
                    let contents = js.code +
                        `
  //# sourceMappingURL=` +
                        toUrl(js.map.toString());
                    if (
                        (compilerOptions.css === false ||
                            compilerOptions.css === 'external') &&
                        css.code
                    ) {
                        const cssPath = args.path
                            .replace('.svelte', '.esbuild-svelte-fake-css')
                            .replace(/\\/g, '/');
                        cssCode.set(
                            cssPath,
                            css.code +
                                `/*# sourceMappingURL=${
                                    toUrl(
                                        css.map.toString(),
                                    )
                                } */`,
                        );
                        contents = contents +
                            `
  import "${cssPath}";`;
                    }
                    if (options == null ? void 0 : options.filterWarnings) {
                        warnings = warnings.filter(options.filterWarnings);
                    }
                    const result: any = {
                        contents,
                        warnings: await Promise.all(
                            warnings.map(
                                async (e: any) =>
                                    await convertMessage(
                                        e,
                                        args.path,
                                        source,
                                        compilerOptions.sourcemap,
                                    ),
                            ),
                        ),
                    };
                    if ((options == null ? void 0 : options.cache) === true) {
                        fileCache.set(args.path, {
                            data: result,
                            dependencies: dependencyModifcationTimes,
                        });
                    }
                    if (
                        ((_b = build.esbuild) == null ? void 0 : _b.context) !==
                            void 0 ||
                        shouldCache(build)
                    ) {
                        result.watchFiles = Array.from(
                            dependencyModifcationTimes.keys(),
                        );
                    }
                    return result;
                } catch (e) {
                    const result: any = {};
                    result.errors = [
                        await convertMessage(
                            e,
                            args.path,
                            originalSource,
                            compilerOptions.sourcemap,
                        ),
                    ];
                    if (
                        ((_c = build.esbuild) == null ? void 0 : _c.context) !==
                            void 0 ||
                        shouldCache(build)
                    ) {
                        result.watchFiles = previousWatchFiles;
                    }
                    return result;
                }
            });
            build.onResolve({ filter: FAKE_CSS_FILTER }, ({ path }: any) => {
                return { path, namespace: 'fakecss' };
            });
            build.onLoad(
                { filter: FAKE_CSS_FILTER, namespace: 'fakecss' },
                ({ path }: any) => {
                    const css = cssCode.get(path);
                    return css
                        ? {
                            contents: css,
                            loader: 'css',
                            resolveDir: dirname(path),
                        }
                        : null;
                },
            );
            if (typeof build.onEnd === 'function') {
                build.onEnd(() => {
                    if (!options) {
                        options = {};
                    }
                    if (options.cache === void 0) {
                        options.cache = true;
                    }
                });
            }
            if (
                shouldCache(build) &&
                (options == null ? void 0 : options.cache) == 'overzealous' &&
                typeof build.onEnd === 'function'
            ) {
                build.initialOptions.metafile = true;
                build.onEnd((result: any) => {
                    let _a, _b, _c;
                    for (
                        const fileName in (_a = result.metafile) == null
                            ? void 0
                            : _a.inputs
                    ) {
                        if (SVELTE_FILTER.test(fileName)) {
                            const file = (_b = result.metafile) == null
                                ? void 0
                                : _b.inputs[fileName];
                            (_c = file == null ? void 0 : file.imports) == null
                                ? void 0
                                : _c.forEach((i: any) => {
                                    if (SVELTE_FILTER.test(i.path)) {
                                        const fileCacheEntry = fileCache.get(
                                            fileName,
                                        );
                                        if (fileCacheEntry != void 0) {
                                            fileCacheEntry == null
                                                ? void 0
                                                : fileCacheEntry.dependencies
                                                    .set(
                                                        i.path,
                                                        statSync(i.path).mtime,
                                                    );
                                            fileCache.set(
                                                fileName,
                                                fileCacheEntry,
                                            );
                                        }
                                    }
                                });
                        }
                    }
                });
            }
        },
    };
}
