<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let options: string[] = [];

    export let value: string | undefined;

    const dispatch = createEventDispatcher();

    export let onChange: (value: string) => void = () => {
        dispatch('change', value);
    };
</script>


<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
    {#each options as option}
        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked={option === value} on:change={() => onChange(option)}>
        <label class="btn btn-outline-primary" for="btnradio1">{option}</label>
    {/each}
</div>