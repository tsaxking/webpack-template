<script lang="ts">
    import { type Blank } from '../../../../shared/struct';
    import { Struct } from '../../../models/struct';
    import Select from '../bootstrap/Select.svelte';
    import Table from './Table.svelte';

    const { structs } = Struct;

    // dropdown to select the struct to manage
// retrieve all
// use jquery datatables
// all cells are contenteditable/inputs

    let currentStruct: string;

    let current: Struct<Blank> | undefined;

    $: current = Array.from(structs).find(([, s]) => s.name === currentStruct)?.[1];
</script>

<Select
    onChange="{value => (currentStruct = value)}"
    options="{Array.from(structs).map(([, s]) => s.name)}"
    value="{currentStruct}"
/>

{#if current}
    <Table bind:current />
{/if}
