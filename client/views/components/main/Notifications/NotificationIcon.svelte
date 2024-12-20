<script lang="ts">
    import { Accounts } from '../../../../models/account';

    export let account: Accounts.AccountData;

    const notifsStore = Accounts.Notification.fromProperty(
        'accountId',
        account.id,
        true
    );
    const notifs = $notifsStore;

    let showNotifs = false;
</script>

<button
    class="btn btn-priamry position-relative p-2 me-5"
    aria-controls="notification-canvas"
    data-bs-target="#notifications-offcanvas"
    data-bs-toggle="offcanvas"
    type="button"
    on:click="{() => (showNotifs = !showNotifs)}"
>
    <i class="material-icons">notifications</i>
    {#if notifs.length}
        <span class="badge bg-danger position-absolute top-0 start-100 translate-middle rout"
        >
            {notifs.length}
        </span>
    {/if}
</button>
