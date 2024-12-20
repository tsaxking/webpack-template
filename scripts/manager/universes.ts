import { Account } from '../../server/structure/structs/account';
import { Permissions } from '../../server/structure/structs/permissions';
import { attemptAsync } from '../../shared/check';
import { backToMain } from '../manager';
import { confirm } from '../prompt';
import { selectData, structActions } from './structs';

const createUniverse = async () => {
    return structActions.new(Permissions.Universe);
};

const deleteUniverse = async () => {
    const universes = (await Permissions.Universe.all(false)).unwrap();
    const universe = await selectData(
        universes,
        'Select a universe to delete...'
    );
    if (!universe) return backToMain('No universe selected');

    const isGood = await confirm(
        `Are you sure you want to delete the universe ${universe.data.name}?`
    );

    if (isGood) {
        universe.delete();
        backToMain(`Universe ${universe.data.name} deleted`);
    } else {
        backToMain('Universe not deleted');
    }
};

const addUniverseToAccount = async () => {
    const [universe, account] = await Promise.all([
        Permissions.Universe.all(false),
        Account.Account.all(false)
    ]);

    const u = universe.unwrap();
    const a = account.unwrap();

    const selectedUniverse = await selectData(u, 'Select a universe to add...');
    if (!selectedUniverse) return backToMain('No universe selected');
    const selectedAccount = await selectData(a, 'Select an account to add...');
    if (!selectedAccount) return backToMain('No account selected');

    const isGood = await confirm(
        `Are you sure you want to add the universe ${selectedUniverse.data.name} to the account ${selectedAccount.data.username}?`
    );
    if (isGood) {
        (await selectedAccount.addUniverses(selectedUniverse.id)).unwrap();

        return backToMain(
            `Universe ${selectedUniverse.data.name} added to account ${selectedAccount.data.username}`
        );
    }

    return backToMain('Universe not added');
};

const removeUniverseFromAccount = async () => {
    const [universe, account] = await Promise.all([
        Permissions.Universe.all(false),
        Account.Account.all(false)
    ]);

    const u = universe.unwrap();
    const a = account.unwrap();

    const selectedAccount = await selectData(
        a,
        'Select an account to remove a universe from...'
    );
    if (!selectedAccount) return backToMain('No account selected');

    const universes = selectedAccount
        .getUniverses()
        .unwrap()
        .map(universe => u.find(u => u.id === universe))
        .filter(Boolean);

    const selectedUniverse = await selectData(
        universes,
        'Select a universe to remove...'
    );
    if (!selectedUniverse) return backToMain('No universe selected');

    const isGood = await confirm(
        `Are you sure you want to remove the universe ${selectedUniverse.data.name} from the account ${selectedAccount.data.username}?`
    );

    if (isGood) {
        (await selectedAccount.removeUniverses(selectedUniverse.id)).unwrap();

        return backToMain(
            `Universe ${selectedUniverse.data.name} removed from account ${selectedAccount.data.username}`
        );
    }

    return backToMain('Universe not removed');
};

export const universes = [
    {
        value: createUniverse,
        description: 'Create a new universe',
        icon: '➕'
    },
    {
        value: deleteUniverse,
        description: 'Delete a universe',
        icon: '🗑️'
    },
    {
        value: addUniverseToAccount,
        description: 'Add a universe to an account',
        icon: '➕'
    },
    {
        value: removeUniverseFromAccount,
        description: 'Remove a universe from an account',
        icon: '➖'
    }
];
