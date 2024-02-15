<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';

export let text: string;
export let color: string = 'primary';
export let deletable: boolean = false;
export let description: string;

let me: HTMLSpanElement;

const d = createEventDispatcher();

onMount(() => {
    jQuery(me).tooltip();
});
</script>

<span
    bind:this="{me}"
    class="badge bg-{color} me-1"
    data-toggle="tooltip"
    title="{description}"
    data-placement="top"
>
    {#if deletable}
        <i
            class="material-icons cursor-pointer text-sm"
            on:click="{() => d('remove')}">close</i
        >
    {/if}
    {text}
</span>

<style>
.material-icons {
    font-size: 1rem;
}
</style>
