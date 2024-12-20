import { Data, Struct } from '../../struct';
import { DB } from '../../../../utilities/database';
import { attemptAsync, resolveAll } from '../../../../../shared/check';
import { app } from '../../../../server';

export namespace Inventory {
    export const Item = new Struct({
        database: DB,
        name: 'Item',
        structure: {
            make: 'text',
            model: 'text',
            type: 'text',
            price: 'integer',
            rentalPrice: 'integer',
            stock: 'integer',
            status: 'text',
            description: 'text'
        },
        versionHistory: {
            amount: 3,
            type: 'versions'
        },
        sample: true
    });

    Item.listen('/add-to-group', async (req, res) => {});

    export const Group = new Struct({
        database: DB,
        name: 'Group',
        structure: {
            name: 'text',
            description: 'text'
        },
        versionHistory: {
            amount: 3,
            type: 'versions'
        },
        sample: true
    });

    export const ItemGroup = new Struct({
        database: DB,
        name: 'ItemGroup',
        structure: {
            item: 'text',
            group: 'text'
        },
        sample: true
    });

    export const getItemsFromGroup = async (group: Data<typeof Group>) => {
        return attemptAsync(async () => {
            const items = (await ItemGroup.all(false)).unwrap();
            const itemGroups = (await ItemGroup.all(false)).unwrap();

            return items.filter(i =>
                itemGroups.some(
                    ig => ig.data.group === group.id && ig.data.item === i.id
                )
            );
        });
    };

    export const addItemToGroup = async (
        item: Data<typeof Item>,
        group: Data<typeof Group>
    ) => {
        return attemptAsync(async () => {
            const has = (await ItemGroup.all(false))
                .unwrap()
                .some(
                    ig => ig.data.item === item.id && ig.data.group === group.id
                );
            if (has) return;

            return ItemGroup.new({
                item: item.id,
                group: group.id
            });
        });
    };

    // export const createItems = async (data: BasicStructable<typeof Item>, num: number) => {
    //     return attemptAsync(async () => {
    //         const items = await Promise.all(
    //             Array.from({ length: num }).map(() => Item.new(data))
    //         );

    //         return resolveAll(items).unwrap();
    //     });
    // };
}
