<script lang="ts">
    import { Accounts } from '../../../models/account';
    import type { BootstrapColor } from '../../../submodules/colors/color';
    import { onMount } from 'svelte';
    import RemovableBadge from '../main/RemovableBadge.svelte';
    import { Permissions } from '../../../models/permissions';

    export let role: Permissions.RoleData;
    export let account: Accounts.AccountData | undefined;
    export let color: BootstrapColor = 'primary';
    export let deletable: boolean = false;
</script>

{#if !!account}
    <RemovableBadge
        {color}
        {deletable}
        description="{role.data.description || ''}"
        text="{role.data.name || ''}"
        on:remove="{() => {
            Permissions.removeRole(account, role);
        }}"
    />
{/if}
