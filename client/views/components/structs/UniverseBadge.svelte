<script lang="ts">
    import { Accounts } from '../../../models/account';
    import { Permissions } from '../../../models/permissions';
    import RemovableBadge from '../main/RemovableBadge.svelte';
    import { onMount } from 'svelte';

    export let universe: string;
    export let account: Accounts.AccountData;

    let name: string;
    const getUniverse = async () => {
        const res = await Permissions.Universe.fromId(universe);
        if (res.isErr()) {
            console.error(res.error);
            return;
        }

        name = res.value.data.name || 'Not Permitted';
    };

    onMount(() => {
        getUniverse();
    });
</script>

<RemovableBadge
    color="primary"
    deletable="{true}"
    description="Universe"
    text="{name || ''}"
    on:remove="{() => {
        account.removeUniverse(universe);
    }}"
/>
