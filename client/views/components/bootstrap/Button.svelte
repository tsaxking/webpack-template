<script lang="ts">
export let color:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'link' = 'primary';
export let disabled: boolean = false;
export let outline: boolean = false;
export let text: string = '';

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();
</script>

<button
    class="btn btn-{outline ? 'outline-' : ''}{color}"
    {disabled}
    on:click="{() => dispatch('click')}"
>
    {text}
    <slot />
</button>
