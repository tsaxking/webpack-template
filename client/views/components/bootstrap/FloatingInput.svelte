<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let type: 'text' | 'textarea' | 'select' = 'text';
    export let placeholder: string = '';
    export let label: string;
    export let value: any;

    const id = 'input-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const dispatch = createEventDispatcher();
</script>




<div class="form-floating">
    {#if type === 'textarea'}
        <textarea class="form-control" id="{id}" placeholder="{placeholder}" bind:value={value} on:input={() => dispatch('input', value)} on:change={() => dispatch('change', value)}></textarea>
    {:else if (type === 'text')}
        <input class="form-control" id="{id}" placeholder="{placeholder}" bind:value={value} on:input={() => dispatch('input', value)} on:change={() => dispatch('change', value)}>
    {:else if (type === 'select')}
        <select class="form-select" id="{id}" bind:value={value} on:input={() => dispatch('input', value)} on:change={() => dispatch('change', value)}>
            <slot></slot>
        </select>
    {/if}
    <label for="{id}">{label}</label>
</div>