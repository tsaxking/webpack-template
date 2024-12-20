<script lang="ts">
    import { onMount } from 'svelte';
    import { Accounts } from '../../../../models/account';
    import NotificationList from './NotificationList.svelte';

    let selfStore = Accounts.self;

    const self = $selfStore;
</script>

<div
    id="notifications-offcanvas"
    style:z-index="1050"
    class="offcanvas offcanvas-end"
>
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">Notifications</h5>
    </div>
    <div class="offcanvas-body">
        {#if self}
            <NotificationList account="{self}" />
        {/if}
    </div>
</div>
