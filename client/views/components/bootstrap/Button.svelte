<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' = 'primary';
    export let disabled: boolean = false;
    export let outline: boolean = false;
<<<<<<< HEAD
    export let classes: string = '';
=======
    export let text: string = '';

    import { createEventDispatcher } from "svelte";
>>>>>>> main

    const dispatch = createEventDispatcher();
</script>


<<<<<<< HEAD
<button class="{classes} btn btn-{outline ? 'outline-' : ''}{color}" {disabled} on:click={() => dispatch('click')}>
=======
<button class="btn btn-{outline ? 'outline-' : ''}{color}" {disabled}>
    {text}
>>>>>>> main
    <slot></slot>
</button>