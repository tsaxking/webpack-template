<script lang="ts">
    import { Stack } from '../../../utilities/stack';

    export let name: string;
    export let value: string | number;
    export let classes = '';
    export let stack: Stack;
    // export let onChange: (value: string | number) => void;
// export let undo: (prev: string | number) => void;

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
                name,
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
