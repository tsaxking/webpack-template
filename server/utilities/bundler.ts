import {
    Bundler,
    HTMLPlugin,
    TypescriptPlugin,
} from 'https://deno.land/x/bundler@0.9.0/mod.ts';
import { Bundle } from 'https://deno.land/x/bundler@0.9.0/plugins/plugin.ts';

/**
 * Bundles a file into a single html file
 * @date 10/12/2023 - 3:24:05 PM
 *
 * @async
 */
export const bundle = async (path: string): Promise<Bundle> => {
    const inputs = [path];
    const outputMap = { [path]: 'index.html' };

    const plugins = [new HTMLPlugin(), new TypescriptPlugin()];

    const bundler = new Bundler({ plugins });

    const assets = await bundler.createAssets(inputs);
    const chunks = await bundler.createChunks(inputs, assets, { outputMap });
    const bundles = await bundler.createBundles(chunks);

    return bundles[0];
};
