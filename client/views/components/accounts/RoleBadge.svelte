<script lang="ts">
import { Role } from '../../../models/roles';
import { Account } from '../../../models/account';
import type { BootstrapColor } from '../../../submodules/colors/color';
import { onMount } from 'svelte';
import RemovableBadge from '../main/RemovableBadge.svelte';

export let role: Role;
export let account: Account;
export let color: BootstrapColor = 'primary';
export let deletable: boolean = false;
</script>

<RemovableBadge
    text="{role.name}"
    {color}
    description="{role.description}"
    {deletable}
    on:remove="{() => {
        account.removeRole(role);
    }}"
/>
