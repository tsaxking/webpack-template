<script lang="ts">
    import { type Blank } from '../../../../shared/struct';
    import { capitalize, fromCamelCase } from '../../../../shared/text';
    import { Permissions } from '../../../models/permissions';
    import { confirm } from '../../../utilities/notifications';
    import StructTable from './StructTable.svelte';

    export let role: Permissions.RoleData;

    let structs: Permissions.StructPermissions<Blank>[] =
        Permissions.StructPermissions.getAll(role);

    export const save = async () => {
        const confirmed = await confirm(
            'Are you sure you want to save these changes?'
        );
        if (!confirmed) return;
        Permissions.StructPermissions.save(structs);
    };
    export const reset = () => {
        for (const s of structs) s.reset();
    };
</script>

<div class="container">
    <div class="row">
        <div
            id="role-editor"
            class="accordion">
            {#each structs as struct, i (struct.struct.name)}
                <div class="accordion-item">
                    <div class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            aria-controls="role-editor-collapse-{i}"
                            data-bs-target="#role-editor-collapse-{i}"
                            data-bs-toggle="collapse"
                            type="button"
                        >
                            {capitalize(fromCamelCase(struct.struct.name))}
                        </button>
                    </div>
                </div>
                <div
                    id="role-editor-collapse-{i}"
                    class="accordion-collapse collapse"
                    data-bs-parent="role-editor"
                >
                    <div class="accordion-body">
                        <StructTable {struct} />
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
