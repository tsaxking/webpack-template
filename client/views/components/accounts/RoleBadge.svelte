<script lang="ts">
import { Role } from '../../../models/roles';
import { Account } from '../../../models/account';
import type { BootstrapColor } from '../../../submodules/colors/color';
import { onMount } from 'svelte';

export let role: Role;
export let account: Account;
export let color: BootstrapColor = 'primary';
export let deletable: boolean = false;

let me: HTMLSpanElement;

onMount(() => {
    jQuery(me).tooltip();
});
</script>

<span
    bind:this="{me}"
    class="badge bg-{color} me-1"
    data-toggle="tooltip"
    title="{role.description}"
    data-placement="top"
>
    {#if deletable}
        <i
            class="material-icons cursor-pointer text-sm"
            on:click="{() => {
                account.removeRole(role);
            }}">close</i
        >
    {/if}
    {role.name}
</span>

<style>
.material-icons {
    font-size: 1rem;
}
</style>
