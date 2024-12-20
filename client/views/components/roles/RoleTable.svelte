<script lang="ts">
    import { Permissions } from '../../../models/permissions';
    // import RoleEditor from './RoleEditor.svelte';
// import Modal from '../bootstrap/Modal.svelte';
    import { prompt } from '../../../utilities/notifications';

    export let universe: Permissions.UniverseData;

    const roles = Permissions.Role.fromProperty('universe', universe.id, true);

    let selected: Permissions.RoleData | null = null;
    // let showEditor = false;
// $: showEditor = !!selected;

    const createNew = async () => {
        if (!universe.id) return;
        const name = await prompt('Role Name');
        if (!name) return;
        const description = await prompt('Role Description');
        if (!description) return;

        const res = await Permissions.Role.new({
            name,
            description,
            universe: universe.id,
            permissions: '',
            linkAccess: ''
        });

        if (res.isErr()) {
            console.error('Failed to create role', res.error);
        }
    };

// let editor: RoleEditor;
// let modal: Modal;
</script>

<button
    class="btn btn-primary w-100"
    type="button"
    on:click="{createNew}">
    Create New Role
    <i class="material-icons">add</i>
</button>

<table class="table table-hover">
    <thead>
        <tr>
            <th>Role</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        {#each $roles as role (role.id)}
            <tr
                class="cursor-pointer"
                on:click="{() => {
                    selected = role;
                }}"
            >
                <td>{role.data.name}</td>
                <td>{role.data.description}</td>
            </tr>
        {/each}
    </tbody>
</table>
<!-- 
{#if selected}
    <Modal
        bind:this="{modal}"
        title="{'Role: ' + selected.data.name}"
        bind:show="{showEditor}"
        on:hide="{() => (selected = null)}"
        on:close="{() => (selected = null)}"
    >
        <RoleEditor
            bind:this="{editor}"
            role="{selected}" />
        <div slot="buttons">
            <button
                class="btn btn-primary"
                type="button"
                on:click="{() => editor.save()}"
            >
                Save
            </button>
            <button
                class="btn btn-warning"
                type="button"
                on:click="{() => editor.reset()}"
            >
                Reset
            </button>
            <button
                class="btn btn-secondary"
                type="button"
                on:click="{() => modal.close()}"
            >
                Close
            </button>
        </div>
    </Modal>
{/if} -->
