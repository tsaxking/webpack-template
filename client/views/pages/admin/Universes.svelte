<script lang="ts">
    import { data } from 'jquery';
    import { Permissions } from '../../../models/permissions';
    import Select from '../../components/bootstrap/Select.svelte';
    import RoleTable from '../../components/roles/RoleTable.svelte';

    const universes = Permissions.Universe.all(true);

    let selected: Permissions.UniverseData | undefined;
</script>

Select Universe

<Select
    defaultValue="Select Universe"
    onChange="{u => {
        selected = $universes.find(uu => uu.id === u);
    }}"
    options="{$universes.map(u => String(u.data.name))}"
    values="{$universes.map(u => String(u.id))}"
/>

{#if selected}
    <p>Selected universe {selected.data.name}</p>
    <RoleTable universe="{selected}" />
{/if}
