<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' = 'primary';
    export let disabled: boolean = false;
    export let outline: boolean = false;
    export let classes: string = '';

    const dispatch = createEventDispatcher();
</script>


<button class="{classes} btn btn-{outline ? 'outline-' : ''}{color}" {disabled} on:click={() => dispatch('click')}>
    <slot></slot>
</button>