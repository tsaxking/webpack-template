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
    <div class="mb-3">
        <FloatingInput label="Name" bind:value={name}></FloatingInput>
    </div>
    <div class="mb-3">
        <FloatingInput label="Description" bind:value={description}></FloatingInput>
    </div>
    <div class="mb-3">
        <select bind:value={type} class="form-select">
            <option value="debit" selected>Debit</option>
            <option value="credit">Credit</option>
            <option value="savings">Savings</option>
        </select>
    </div>
    <input type="submit" value="Submit" class="btn btn-primary">
</form>