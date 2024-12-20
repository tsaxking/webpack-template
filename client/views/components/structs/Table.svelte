<script lang="ts">
    import { onMount } from 'svelte';
    import { type Blank } from '../../../../shared/struct';
    import { Struct } from '../../../models/struct';
    import Row from './Row.svelte';
    import jQuery from 'jquery';
    import { capitalize, fromCamelCase } from '../../../../shared/text';

    export let current: Struct<Blank>;

    const headers = Object.keys(current.data.structure);

    const all = current.all(true);

    let table: HTMLTableElement;

    onMount(() => {
        // TODO: is jquery datatables good?
    // I don't know if it will work with editable cells
    // are there other packages that would be better?
        jQuery(table).dataTable();

        table.querySelectorAll('.tt').forEach(el => {
            jQuery(el).tooltip();
        });
        return () => {
            // jQuery(table).dataTable().destroy();
            table.querySelectorAll('.tt').forEach(el => {
                jQuery(el).tooltip('dispose');
            });
        };
    });
</script>

<table bind:this="{table}">
    <thead>
        <tr>
            {#each headers as header (header)}
                <th>{capitalize(fromCamelCase(header))}</th>
            {/each}
            <th
                class="tt"
                data-bs-tooltip="The date and time the row was created"
                title="The date and time the row was created">Created</th
            >
            <th
                class="tt"
                data-bs-tooltip="The date and time the row was last updated"
                title="The date and time the row was last updated">Updated</th
            >
            <!-- <th>Universes</th> -->
            <!-- <th>Attributes</th> -->
            <th
                class="tt"
                data-bs-tooltip="How long (in milliseconds) the row will exist since it was created"
                title="How long (in milliseconds) the row will exist since it was created"
            >Lifetime</th
            >
            <th
                class="tt"
                data-bs-tooltip="If the row is archived"
                title="If the row is archived">Archived</th
            >
        </tr>
    </thead>
    <tbody>
        {#each $all as row (row.id)}
            <Row
                {headers}
                bind:data="{row}" />
        {/each}
    </tbody>
</table>
