<script lang="ts">
    import { date } from '../../../../../shared/clock';
    import { capitalize } from '../../../../../shared/text';
    import { Accounts } from '../../../../models/account';
    import { type Structable } from '../../../../models/struct';

    export let notification: Accounts.NotificationData;

    const pulled = notification.pull(
        'accountId',
        'data',
        'message',
        'read',
        'title',
        'type'
    );

    let data: Structable<typeof Accounts.Notification.data.structure> | undefined;

    if (pulled) {
        data = $pulled;
    }
</script>

{#if data}
    <div class="card">
        <div class="card-title p-1 m-1 d-flex justify-content-between">
            <h5>{capitalize(data.title)}</h5>
        </div>
        <div
            class="btn-group"
            role="group">
            <button
                class="btn p-0 m-0 hover-color"
                on:click="{() =>
                    notification.update(() => ({
                        read: !data.read
                    }))}"
            >
                <i class="material-icons">
                    {#if data.read}
                        mark_email_read
                    {:else}
                        mark_email_unread
                    {/if}
                </i>
            </button>
        </div>
        <div class="card-body p-1 m-0">
            <p>{capitalize(data.message)}</p>
            <p class="text-mute">{date(notification.created)}</p>
        </div>
    </div>
{/if}

<style>
.hover-color:hover {
    color: var(--bs-secondary);
}
</style>
