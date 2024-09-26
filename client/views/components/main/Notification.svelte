<script lang="ts">
    import { onMount } from 'svelte';
    import { date } from '../../../../shared/clock';
    import { match } from '../../../../shared/match';
    import { capitalize } from '../../../../shared/text';
    import { AccountNotification } from '../../../models/account-notifications';
    import { contextmenu } from '../../../utilities/contextmenu';
    import { confirm } from '../../../utilities/notifications';

    export let notification: AccountNotification;

    let color: string;

    $: color = match<string, string>(notification.type)
        .case('info', () => 'info')
        .case('warning', () => 'warning')
        .case('error', () => 'danger')
        .default(() => 'primary')
        .exec()
        .unwrap();

    let classes: string;

    $: {
        if (notification.read) {
            classes = `border-${color}`;
        } else {
            classes = `text-bg-${color}`;
        }
    }

    const update = () => {
        notification = notification;

        decontextmenu?.();

        decontextmenu = contextmenu(div, [
            {
                name: notification.read ? 'Mark as unread' : 'Mark as read',
                action: () => {
                    notification.markRead(!notification.read);
                }
            },
            {
                name: 'Delete',
                action: async () => {
                    if (
                        await confirm(
                            'Are you sure you want to delete this notification?'
                        )
                    ) {
                        notification.delete();
                    }
                }
            }
        ]);
    };

    let div: HTMLDivElement;
    let decontextmenu: () => void;

    onMount(() => {
        update();

        notification.on('read', update);

        () => {
            notification.off('read', update);
        };
    });
</script>

<div
    bind:this="{div}"
    class="card {classes}">
    <div class="card-title p-1 m-0 d-flex justify-content-between">
        <h5>{capitalize(notification.title)}</h5>
        <div
            class="btn-group"
            role="group">
            <button
                class="btn p-0 m-0 hover-color"
                on:click="{() => notification.markRead(!notification.read)}"
            >
                <i class="material-icons">
                    {notification.read
                        ? 'mark_email_read'
                        : 'mark_email_unread'}
                </i>
            </button>
            <button
                class="btn p-0 m-0 hover-color"
                on:click="{async () => {
                    if (
                        await confirm(
                            'Are you sure you want to delete this notification?'
                        )
                    ) {
                        notification.delete();
                    }
                }}"
            >
                <i class="material-icons">close</i>
            </button>
        </div>
    </div>
    <div class="card-body p-1 m-0">
        <p>{capitalize(notification.message)}</p>
        <p class="text-muted">{date(notification.created)}</p>
    </div>
</div>

<style>
.hover-color:hover {
    color: var(--bs-secondary);
}
</style>
