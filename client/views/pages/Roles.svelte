<script lang="ts">
import { type RolePermission } from '../../../shared/db-types';
import { Role } from '../../models/roles';
import RemovableBadge from '../components/main/RemovableBadge.svelte';
import { onMount } from 'svelte';
import { alert, confirm, select } from '../../utilities/notifications';

let roles: Role[] = [];
let permissions: RolePermission[] = [];

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
    addPermission: async (role: Role) => {
        const current = role.permissions.map(p => p.permission);
        const addable = permissions.filter(
            p => !current.includes(p.permission)
        );
        if (!addable.length) {
            return alert('No permissions to add');
        }

        console.log('Add permission to role', role, addable);

        const p = await select(
            'Add permission',
            addable.map(p => p.permission)
        );

        console.log(p);

        if (p >= 0) {
            role.addPermission(addable[p]);
        }
    },
    deleteRole: async (role: Role) => {
        const good = await confirm(
            'Are you sure you want to delete this role?'
        );
        if (good) {
            await role.delete();
        }
    },
    getPermissions: async () => {
        const perms = await Role.getAllPermissions();
        if (perms.isOk()) {
            permissions = perms.value;
        }
    },
    init: () => {
        fns.getRoles();
        fns.getPermissions();
    }
};

Role.on('new', fns.getRoles);
Role.on('update', fns.getRoles);
Role.on('delete', fns.getRoles);

onMount(fns.init);
</script>

<div class="table-responsive">
    <table class="table" bind:this="{table}">
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
                                text="{permission.permission}"
                                description="{permission.description}"
                                color="secondary"
                                deletable="{true}"
                                on:remove="{async () => {
                                    const doIt = await confirm(
                                        'Are you sure you want to remove this permission?'
                                    );
                                    if (doIt) role.removePermission(permission);
                                }}"
                            />
                        {/each}
                    </td>
                    <td>{role.rank}</td>
                    <td>
                        <div class="btn-group">
                            <button
                                class="btn btn-primary tt"
                                data-toggle="tooltip"
                                title="Add permissions to {role.name}"
                                data-placement="top"
                                on:click="{() => fns.addPermission(role)}"
                            >
                                <i class="material-icons">add</i>
                            </button>
                            <button
                                class="btn btn-danger tt"
                                data-toggle="tooltip"
                                title="Delete role {role.name}"
                                data-placement="top"
                                on:click="{() => fns.deleteRole(role)}"
                            >
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
