<script lang="ts">
    // This file will not render a link if a user does not have access to it

    import { onMount } from 'svelte';
    import { Accounts } from '../../../models/account';
    import { Permissions } from '../../../models/permissions';

    export let link: string; // full url path
    export let classes = '';
    export let text = link;

    let hasAccess = false;

    const getAccess = async () => {
        const account = await Accounts.getSelf();
        if (account.isErr()) {
            return console.error('Failed to get account', account.error);
        }

        const pageAccess = Permissions;
    };

    onMount(() => {
        getAccess();
    });
</script>

{#if hasAccess}
    <a
        class="{classes}"
        href="{link}">
        {text}
    </a>
{:else}
    <span class="{classes} text-secondary">
        {text}
    </span>
{/if}
