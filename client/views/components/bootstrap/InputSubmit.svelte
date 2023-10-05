<script lang="ts">
    import { capitalize, toSnakeCase } from '../../../../shared/text';
    import { random } from '../../../utilities/uuid';
    import Button from './Button.svelte';
    import { createEventDispatcher } from 'svelte';

    export let value: string;
    export let label: string;
    export let disabled: boolean = false;
    export let placeholder: string = '';
    export let buttonColor: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' = 'primary';
    export let buttonOutline: boolean = false;

    const id = random();

    const dispatch = createEventDispatcher();

    const save = () => {
        dispatch('save', { value, label });
    }

    const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            save();
        }
    }
</script>



<div class="mb-3">
    <label class="form-label" for="myInput-{id}">{capitalize(label)}</label>
    <div class="d-flex justify-content-space-between align-items-center">
        <input class="form-control m-3" id="myInput-{id}" name="{toSnakeCase(label, '-')}" bind:value={value} placeholder="{placeholder}" on:keydown={keydown}>
        <Button classes="m-3" color={buttonColor} outline={buttonOutline} {disabled} on:click={() => save()}>
            <i class="material-icons">save</i>
        </Button>
    </div>
</div>