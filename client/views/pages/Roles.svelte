<script lang="ts">
import { Role } from "../../models/roles";
import RemovableBadge from "../components/main/RemovableBadge.svelte";
import { onMount } from "svelte";


    let roles: Role[] = [];

    let table: HTMLTableElement;


    const fns = {
        getRoles: async () => {
            const res = await Role.all(true);
            if (res.isOk()) {
                // console.log('Roles', res.value);
                roles = res.value;
            }

            fns.set();
        },
        set: () => {
            // if (table) {
            //     table.querySelectorAll('.tt').forEach(el=> {
            //         jQuery(el).tooltip();
            //     });
            // }
        },
        addPermission: (role: Role) => {
            console.log('Add permission to', role);
        },
        deleteRole: (role: Role) => {
            console.log('Delete role', role);
        }
    };

    Role.on('new', fns.getRoles);
    Role.on('update', fns.getRoles);
    Role.on('delete', fns.getRoles);

    onMount(fns.getRoles);
</script>

<div class="table-responsive">
    <table class="table" bind:this={table}>
        <thead>
            <tr>
                <th>Name</th>
                <th>Permissions</th>
                <th>Rank</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each roles as role}
                <tr>
                    <td>{role.name}</td>
                    <td>
                        {#each role.permissions as permission}
                            <RemovableBadge
                                text={permission.permission}
                                description={permission.description}
                                color="secondary"
                                deletable={true}
                                on:remove={() => {
                                    role.removePermission(permission);
                                }}
                            />
                        {/each}
                    </td>
                    <td>{role.rank}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-primary tt" 
                            data-toggle="tooltip"
                            title="Add permissions to {role.name}"
                            data-placement="top" on:click={() => fns.addPermission(role)}>
                                <i class="material-icons">add</i>
                            </button>
                            <button class="btn btn-danger tt"
                            data-toggle="tooltip"
                            title="Delete role {role.name}"
                            data-placement="top" on:click={() => fns.deleteRole(role)}>
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>