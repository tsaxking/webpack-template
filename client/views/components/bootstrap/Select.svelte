<script lang="ts">
import { createEventDispatcher } from 'svelte';

export let options: string[] = [];
export let values: string[] = [];
export let value: string = '';
export let defaultValue: string | undefined = undefined;

const dispatch = createEventDispatcher();

const handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    dispatch('change', target.value);
};

$: {
    if (values.length) {
        if (values.length !== options.length) {
            throw new Error('Values and options must be the same length');
        }
    }
}
</script>

<select bind:value on:change="{handleChange}" class="form-select">
    {#if defaultValue}
        <option value="" disabled selected="{!value}">{defaultValue}</option>
    {/if}

    {#each options as option, i}
        <option
            value="{values[i] || option}"
            selected="{value == (values[i] || option)}">{option}</option
        >
    {/each}
</select>
