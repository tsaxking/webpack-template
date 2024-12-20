<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let options: string[] = [];
    export let values: string[] = [];
    export let value: string = '';
    export let defaultValue: string | undefined = undefined;
    export let onChange: (value: string) => void = () => {};

    const dispatch = createEventDispatcher();

    const handleChange = (event: Event) => {
        const target = event.target as HTMLSelectElement;
        onChange(target.value);
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

<select
    class="form-select"
    bind:value
    on:change="{handleChange}">
    {#if defaultValue}
        <option
            disabled
            selected="{!value}"
            value="">{defaultValue}</option>
    {/if}

    {#each options as option, i (option)}
        <option
            selected="{value == (values[i] || option)}"
            value="{values[i] || option}">{option}</option
        >
    {/each}
</select>
