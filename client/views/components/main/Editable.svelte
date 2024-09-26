<script lang="ts">
    import { onMount } from 'svelte';
    import { Stack } from '../../../utilities/stack';

    export let value: string | number;
    export let classes = '';
    export let stack: Stack;

    let focus = false;
    let input: HTMLInputElement;
</script>

<input
    bind:this="{input}"
    class="form-control {classes}"
    class:show="{focus}"
    type="text"
    {value}
    on:blur="{e => {
        if (e.currentTarget.value !== value) {
            const current = value;
            const next = e.currentTarget.value;
            value = next;
            stack.push({
                name: 'Channel name change',
                undo: () => (value = current),
                redo: () => (value = next)
            });
        }
        focus = false;
    }}"
/>
<span
    class="{classes}"
    class:show="{!focus}"
    on:click="{() => {
        focus = true;
        input.focus();
    }}">{value}</span
>

<style>
.show {
    display: none;
}
</style>
