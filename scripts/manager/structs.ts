/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs';
import {
    Data,
    DataVersion,
    PartialStructable,
    Struct,
    Structable
} from '../../server/structure/structs/struct';
import { attemptAsync, resolveAll, Result } from '../../shared/check';
import { __root } from '../../server/utilities/env';
import { select, repeatPrompt, selectTable, prompt, confirm } from '../prompt';
import { match } from '../../shared/match';
import { capitalize, fromCamelCase, removeWhitespace } from '../../shared/text';
import { SQL_Type, Blank, checkStrType, returnType } from '../../shared/struct';
import { Permissions } from '../../server/structure/structs/permissions';

export const openStructs = () => {
    return attemptAsync<Struct<Blank, string>[]>(async () => {
        const readDir = async (
            dir: string
        ): Promise<Struct<Blank, string>[]> => {
            const contents = await fs.promises.readdir(dir);
            const res = await Promise.all(
                contents.map(async object => {
                    if (fs.lstatSync(path.join(dir, object)).isDirectory()) {
                        return await readDir(path.join(dir, object));
                    }
                    return readFile(path.join(dir, object));
                })
            );

            return res.flat();
        };
        const readFile = async (file: string) => {
            if (file.includes('.image')) return [];
            // console.log('Opening file:', file);
            const data = await import(path.relative(__dirname, file));
            // console.log(data);

            const structs: Struct<Blank, string>[] = [];

            const openObj = (obj: Record<string, unknown>) => {
                for (const value of Object.values(obj)) {
                    if (value instanceof Struct) {
                        if (!value.data.sample) structs.push(value);
                        continue;
                    }

                    if (typeof value === 'object') {
                        openObj(value as Record<string, unknown>);
                    }
                }
            };

            // return Object.entries(data)
            //     .filter(([, value]) => value instanceof Struct)
            //     .map(([key, value]) => value as Struct<Blank, string>);

            openObj(data);

            return structs;
        };

        const res = await readDir(
            path.resolve(__root, 'server/structure/structs')
        );

        // console.log(res);
        // throw new Error('Close');

        return res.sort((a, b) => a.name.localeCompare(b.name));
    });
};

export const selectStruct = async (
    message?: string,
    structs?: Struct<Blank, string>[]
) => {
    const s = structs || (await openStructs()).unwrap();
    return select(
        message || 'Select a struct',
        s.map(v => ({
            value: v,
            name: v.name
        })),
        {
            return: true,
            clear: true,
            exit: true
        }
    );
};

export const selectData = async <T extends Data<Struct<Blank, string>>>(
    data: T[],
    message?: string,
    options?: {
        omit?: (keyof T['data'])[];
    }
) => {
    const run = async (): Promise<T | undefined> => {
        const res = await selectTable(
            message || 'Select a data',
            data.map(d => d.data),
            {
                omit: options?.omit as string[]
                // return: true,
                // exit: true,
            }
        );

        if (!res) {
            // console.log('No data selected');
            return undefined;
        }

        const d = data.find(d => d.id === res.id);
        if (!d) {
            console.log('data not found');
            return run();
        }
        return d;
    };

    return run();
};

export const versionActions = {
    restore: async (version: DataVersion<Blank, string>) => {
        const res = await confirm(
            'Are you sure you want to restore this version?'
        );
        if (res) {
            (await version.restore()).unwrap();
            return backToStruct('Version restored');
        }

        return backToStruct('Version not restored');
    },
    delete: async (version: DataVersion<Blank, string>) => {
        const res = await confirm(
            'Are you sure you want to delete this version?'
        );
        if (res) {
            (await version.delete()).unwrap();
            return backToStruct('Version deleted');
        }

        return backToStruct('Version not deleted');
    }
};

export const selectVersionHistory = async (
    versions: DataVersion<Blank, string>[]
) => {
    const selected = await selectTable(
        'Select a version',
        versions.map(v => v.data)
    );

    return versions.find(v => v.vhId === selected?.vhId);
};

export const versionHistoryPipe = async (
    versions: DataVersion<Blank, string>[]
) => {
    const selected = await selectVersionHistory(versions);

    if (selected) {
        const actions = Object.entries(versionActions);
        const action = await select(
            'Select an action for this version',
            actions.map(a => ({
                value: a[1],
                name: capitalize(fromCamelCase(a[0]))
            }))
        );

        if (action) return action(selected);
    }

    return backToStruct('No version selected');
};

export const dataActions = {
    update: async (data: Data<Struct<Blank, string>>) => {
        const properties = Object.entries(data.data)
            // ignore global cols
            .filter(
                ([e]) =>
                    ![
                        'id',
                        'archived',
                        'created',
                        'updated',
                        'universes',
                        'attributes'
                    ].includes(e)
            );

        const toUpdate: Record<string, unknown> = {};

        for (const p of properties) {
            const [name, current] = p;
            const type =
                name === 'lifetime'
                    ? 'integer'
                    : data.struct.data.structure[name];
            const val = await repeatPrompt(
                `[${type}] ${name} (${current}):`,
                undefined,
                v => checkStrType(v, type),
                true
            );

            if (val.length) {
                toUpdate[name] = returnType(val, type);
            }
        }

        (await data.update(toUpdate as Partial<typeof data.data>)).unwrap();

        return backToStruct(`Updated ${data.struct.name} ${data.id}`);
    },
    delete: async (data: Data<Struct<Blank, string>>) => {
        const res = await confirm('Are you sure you want to delete this?');
        if (res) {
            (await data.delete()).unwrap();
            return backToStruct('Data deleted');
        }
        return backToStruct('Data not deleted');
    },
    archive: async (data: Data<Struct<Blank, string>>) => {
        const res = await confirm('Are you sure you want to archive this?');
        if (res) {
            (await data.setArchive(true)).unwrap();
            return backToStruct('Data archived');
        }
        return backToStruct('Data not archived');
    },
    restore: async (data: Data<Struct<Blank, string>>) => {
        const res = await confirm('Are you sure you want to restore this?');
        if (res) {
            (await data.setArchive(false)).unwrap();
            return backToStruct('Data restored');
        }
        return backToStruct('Data not restored');
    },
    versionHistory: async (data: Data<Struct<Blank, string>>) => {
        const history = (await data.getVersionHistory()).unwrap();
        if (history === 'not-enabled') {
            return backToStruct(
                `Version history not enabled on ${data.struct.name}`
            );
        }
        return versionHistoryPipe(history);
    },
    addAttributes: async (data: Data<Struct<Blank, string>>) => {
        const attributes = await prompt(
            'Enter attributes to add (comma separated, no spaces)'
        );

        const separated = attributes
            .split(',')
            .map(d => removeWhitespace(d.trim()));
        (await data.addAttributes(...separated)).unwrap();

        return backToStruct('Attributes added');
    },
    removeAttribute: async (data: Data<Struct<Blank, string>>) => {
        const attributes = data.getAttributes().unwrap();

        const attribute = await select<string>(
            'Select an attribute to remove',
            attributes
        );

        if (!attribute) return backToStruct('No attribute selected');

        const res = await confirm(
            `Are you sure you want to remove ${attribute} from this?`
        );

        if (res) {
            (await data.removeAttribute(attribute)).unwrap();

            return backToStruct('Attribute deleted');
        }

        return backToStruct('Attribute not deleted');
    },
    setAttributes: async (data: Data<Struct<Blank, string>>) => {
        const attributes = await prompt(
            'Enter attributes to set (comma separated, no space)'
        );

        const separated = attributes
            .split(',')
            .map(d => removeWhitespace(d.trim()));

        const res = await confirm(
            `Are you sure you want to overwrite the current attributes (${data.getAttributes().unwrap()} and overwrite them with ${separated.join(', ')}`
        );

        if (res) {
            (await data.setAttributes(separated)).unwrap();
            return backToStruct('Attributes set');
        }

        return backToStruct('Attributes were not set');
    },
    addToUniverse: async (data: Data<Struct<Blank, string>>) => {
        const universes = (await Permissions.Universe.all(false)).unwrap();
        const selected = await select(
            'Select a universe to add',
            universes.map(u => ({
                value: u,
                name: u.data.name
            }))
        );

        if (selected) {
            (await data.addUniverses(selected.id)).unwrap();
            return backToStruct('Universe added');
        }

        return backToStruct('Universe not added');
    },
    // getUniverses: async (data) => {},
    setUniverses: async (data: Data<Struct<Blank, string>>) => {
        // const currentIds = data.getUniverses().unwrap();
        const universes = (await Permissions.Universe.all(false)).unwrap();
        // const current = universes.filter(u => currentIds.includes(u.id));

        const toSet: string[] = [];

        const run = async () => {
            const res = await select('Select a universe to add', [
                {
                    value: '$$done$$',
                    name: 'Done'
                },
                ...universes.map(u => ({
                    value: u.id,
                    name: u.data.name
                }))
            ]);

            if (res === '$$done$$') {
                const sure = await confirm(
                    'Are you sure you want to set these universes?'
                );
                if (sure) {
                    (await data.setUniverses(toSet)).unwrap();
                    return backToStruct('Universes set');
                }

                return backToStruct('Universes not set');
            }

            if (res) {
                toSet.push(res);
                run();
            }
        };

        return await run();
    },
    removeFromUniverse: async (data: Data<Struct<Blank, string>>) => {
        const currentIds = data.getUniverses().unwrap();
        const has = (await Permissions.Universe.all(false))
            .unwrap()
            .filter(u => currentIds.includes(u.id));

        const selected = await select(
            'Select a universe to delete',
            has.map(u => ({
                value: u,
                name: u.data.name
            }))
        );

        if (selected) {
            const res = await confirm(
                `Are you sure you want to remove this from ${selected.data.name}?`
            );

            if (res) {
                (await data.removeUniverses(selected.id)).unwrap();
                return backToStruct('Data removed from universe');
            }

            return backToStruct('Data not removed from universe');
        }

        return backToStruct('No universe selected');
    }
};

export const selectDataAction = async (data: Data<Struct<Blank, string>>) => {
    const actions = Object.entries(dataActions);
    const selected = await select(
        'Select an action for this data',
        actions.map(a => ({
            value: a[1],
            name: capitalize(fromCamelCase(a[0]))
        }))
    );

    if (selected) return selected(data);

    return backToStruct('No action selected');
};

export const dataSelectPipe = async (data: Data<Struct<Blank, string>>[]) => {
    const selected = await selectData(data);
    if (selected) return selectDataAction(selected);
    return backToStruct('No data selected');
};

export const structActions = {
    new: async <T extends Struct<Blank, string>>(
        struct: T,
        additions?: Partial<Structable<T>>
    ) => {
        const properties = Object.entries(struct.data.structure);

        console.log(
            removeWhitespace(
                `
            Type instructions:
            Booleans: y = true, n = false, 1 = true, 0 = false, true = true, false = false
            Text: Anything
            Integers: Whole numbers
            Reals: Decimal numbers
            Bigints: Numbers above 2^53

            If something is a date, use the exact format ${new Date().toISOString()},
            otherwise dates will not work.
        `.trim()
            )
        );

        const data: Record<string, unknown> = {};

        for (const p of properties) {
            const [key, type] = p;
            if (additions && additions[key]) {
                data[key] = additions[key];
                continue;
            }
            const res = await repeatPrompt(
                `Value for ${key} (${type})`,
                undefined,
                v => checkStrType(v, type)
            );

            data[key] = returnType(res, type);
        }

        const res = await struct.new(data as Structable<typeof struct>);

        if (res.isErr()) {
            console.error(res.error);
            return async () => {
                console.log('Failed to create new data');
                const res = await confirm('Try again?');
                if (res) {
                    await structActions.new(struct);
                } else {
                    return backToStruct('Done');
                }
            };
        }

        return backToStruct('New data created');
    },
    deleteImage: async (struct: Struct<Blank, string>) => {
        const sure = await confirm(
            `Are you sure you want to delete the image for ${struct.name}?`
        );
        if (sure) {
            (await struct.deleteImage()).unwrap();
        }
        return backToStruct('Did not delete image');
    },
    all: async (struct: Struct<Blank, string>) => {
        const all = (await struct.all(false)).unwrap();
        const selected = await selectData(all, `Select a(n) ${struct.name}`);
        if (selected) return selectDataAction(selected);
        return backToStruct('No data selected');
    },
    fromProperty: async (struct: Struct<Blank, string>) => {
        const properties = Object.entries(struct.data.structure);
        const selected = await select(
            'Filter property',
            properties.map(p => ({
                value: p,
                name: `${p[0]} (${p[1]})`
            }))
        );

        if (selected) {
            const [name, type] = selected;
            const res = await repeatPrompt(`${name}`, undefined, v =>
                checkStrType(v, type)
            );

            const data = (await struct.fromProperty(name, res, false)).unwrap();

            dataSelectPipe(data);
        }

        return backToStruct('No data selected');
    },
    fromUniverse: async (struct: Struct<Blank, string>) => {
        const universes = (await Permissions.Universe.all(false)).unwrap();
        const universe = await select(
            'Select a universe',
            universes.map(u => ({
                value: u,
                name: u.data.name
            }))
        );

        const data = (await struct.fromUniverse(universe.id, false)).unwrap();
        dataSelectPipe(data);
    },
    archived: async (struct: Struct<Blank, string>) => {
        const data = (await struct.archived(false)).unwrap();
        dataSelectPipe(data);
    },
    drop: async (struct: Struct<Blank, string>) => {
        const sure = await confirm(
            `Are you sure you want to delete ${struct.name}?`
        );
        if (sure) {
            (await struct.clear()).unwrap();
            (await struct.clear()).unwrap();

            return backToStruct('Deleted struct');
        }

        return backToStruct('Did not delete struct');
    },
    clear: async (struct: Struct<Blank, string>) => {
        const sure = await confirm(
            `Are you sure you want to clear ${struct.name}?`
        );
        if (sure) {
            (await struct.clear()).unwrap();

            return backToStruct('Cleared struct');
        }

        return backToStruct('Did not clear struct');
    }
};

export const selectStructAction = async (struct: Struct<Blank, string>) => {
    const actions = Object.entries(structActions);

    const selected = await select(
        `Select an action for ${struct.name}`,
        actions.map(a => ({
            value: a[1],
            name: capitalize(fromCamelCase(a[0]))
        })),
        {
            return: true,
            exit: true
        }
    );

    if (selected) return selected(struct);
};

export const struct = async (): Promise<
    ((...data: unknown[]) => unknown) | void
> => {
    const selected = await selectStruct('Select a struct');
    return selectStructAction(selected);
};

export const backToStruct = async (message: string) => {
    await select(message, ['[OK]']);

    return struct();
};

export const structs = [
    {
        icon: '🏗️',
        description: 'Manage structures',
        value: struct
    }
];
