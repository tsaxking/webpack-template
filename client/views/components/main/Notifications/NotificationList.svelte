<script lang="ts">
    import { Accounts } from '../../../../models/account';
    import Notification from './Notification.svelte';

    export let account: Accounts.AccountData;

    const list = Accounts.Notification.fromProperty(
        'accountId',
        account.id || '',
        true
    );
    const notifs = $list;
</script>

{#each notifs as notification (notification.id)}
    <Notification {notification} />
{/each}
