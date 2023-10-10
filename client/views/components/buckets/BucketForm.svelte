<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import FloatingInput from '../bootstrap/FloatingInput.svelte';

    const dispatch = createEventDispatcher();

    export let name: string = '';
    export let description: string = '';
    export let type: 'debit' | 'credit' | 'savings' = 'debit';

    export function submit() {
        dispatch('submit', {
            name,
            description,
            type
        });
    }
</script>

<form on:submit|preventDefault={submit}>
    <FloatingInput label="Name" bind:value={name}></FloatingInput>
    <FloatingInput label="Description" bind:value={description}></FloatingInput>
    <select bind:value={type}>
        <option value="debit" selected>Debit</option>
        <option value="credit">Credit</option>
        <option value="savings">Savings</option>
    </select>
    <input type="submit" value="Submit" class="btn btn-primary">
</form>