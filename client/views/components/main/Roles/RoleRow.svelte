<script lang="ts">
    import { Permissions } from '../../../../models/permissions';
    import ButtonGroup from '../../bootstrap/ButtonGroup.svelte';
    import Modal from '../../bootstrap/Modal.svelte';

    export let role: Permissions.RoleData;

    const data = $role;

    const np = '[Not Permitted]';

    let edit = false;
</script>

<tr on:click="{() => (edit = true)}">
    <td>
        {data.name || np}
    </td>
    <td>
        {data.description || np}
    </td>
    <td>
        <ButtonGroup>
            <button
                class="btn btn-danger"
                type="button">
                <i class="material-icons">delete</i>
            </button>
        </ButtonGroup>
    </td>
</tr>

<Modal
    title="{`Edit ${role.data.name}`}"
    bind:show="{edit}">
    <div slot="buttons" />
</Modal>
