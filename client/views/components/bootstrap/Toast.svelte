<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

export let title: string;
export let autoHide: number = 0;

let time: string = 'Just now';
const start = Date.now();
setInterval(() => {
    const now = Date.now();
    const diff = now - start;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
        time = `${seconds} seconds ago`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        time = `${minutes} minutes ago`;
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        time = `${hours} hours ago`;
    } else {
        const days = Math.floor(seconds / 86400);
        time = `${days} days ago`;
    }
}, 1000 * 30);

if (autoHide) {
    setTimeout(() => {
        dispatch('hide.bs.toast');
    }, autoHide);
}

const classes = 'toast';

export let show: boolean = false;
export let message: string = '';

export let color:
    | 'info'
    | 'success'
    | 'danger'
    | 'warning'
    | 'secondary'
    | 'light' = 'info';
export let bodyTextColor: 'white' | 'dark';
</script>

<div
    class="{show ? 'show ' + classes : classes}"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
>
    <div class="toast-header bg-dark border-0 text-{color}">
        <strong class="me-auto">{title}</strong>
        <small>{time}</small>
        <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="toast"
            aria-label="Close"
            on:click="{() => dispatch('hide.bs.toast')}"
        ></button>
    </div>
    <div
        class="toast-body bg-{color} {bodyTextColor
            ? 'text-' + bodyTextColor
            : ''}"
    >
        {message}
        <slot />
    </div>
</div>
