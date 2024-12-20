<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let options: string[] = [];

    export let value: string | undefined;

    const dispatch = createEventDispatcher();

    export let onChange: (value: string) => void = () => {
        dispatch('change', value);
    };
</script>

<div
    class="btn-group"
    aria-label="Basic radio toggle button group"
    role="group"
>
    {#each options as option}
        <input
            id="btnradio1"
            name="btnradio"
            class="btn-check"
            autocomplete="off"
            checked="{option === value}"
            type="radio"
            on:change="{() => onChange(option)}"
        />
        <label
            class="btn btn-outline-primary"
            for="btnradio1">{option}</label>
    {/each}
</div>
