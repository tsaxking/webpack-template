<script lang="ts">
    import { onMount } from 'svelte';
    import { AccountNotification } from '../../../models/account-notifications';
    import Notification from './Notification.svelte';

    export let notifications: AccountNotification[] = [];

    const update = () => {
        notifications = notifications;
    };

    const newNotif = (notif: AccountNotification) => {
        notifications = [notif, ...notifications];
    };

    const deleteNotif = (notif: AccountNotification) => {
        notifications = notifications.filter(n => n.id !== notif.id);
    };

    onMount(() => {
        AccountNotification.on('new', newNotif);
        AccountNotification.on('read', update);
        AccountNotification.on('delete', deleteNotif);

        return () => {
            AccountNotification.off('new', newNotif);
            AccountNotification.off('read', update);
            AccountNotification.off('delete', deleteNotif);
        };
    });
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
        {#if notifications.length === 0}
            <p class="text-center">No notifications to show</p>
        {:else}
            <div class="container-fluid">
                {#each notifications as notification}
                    <div class="row mb-3">
                        <Notification {notification} />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
