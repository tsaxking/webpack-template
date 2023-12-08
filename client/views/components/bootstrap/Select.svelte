<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let options: string[] = [];
    export let value: string = '';

    const dispatch = createEventDispatcher();

    const handleChange = (event: Event) => {
        const target = event.target as HTMLSelectElement;
        dispatch('change', target.value);
    }
</script>

<select bind:value on:change={handleChange} class="form-select">
    {#each options as option}
        <option value={option}>{option}</option>
    {/each}
</select>