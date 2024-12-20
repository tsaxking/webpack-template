<script lang="ts">
    import { type RolePermission } from '../../../shared/db-types';
    import { Role } from '../../models/roles';
    import RemovableBadge from '../components/main/RemovableBadge.svelte';
    import { onMount } from 'svelte';
    import { alert, confirm, select } from '../../utilities/notifications';

    let roles: Role[] = [];
    let permissions: RolePermission[] = [];

    let table: HTMLTableElement;

    const getRoles = async () => {
        const res = await Role.all(true);
        if (res.isOk()) {
            // console.log('Roles', res.value);
            roles = res.value;
        }

        set();
    };
    const set = () => {
    // if (table) {
    //     table.querySelectorAll('.tt').forEach(el=> {
    //         jQuery(el).tooltip();
    //     });
    // }
    };
    const addPermission = async (role: Role) => {
        const current = role.permissions.map(p => p.permission);
        const addable = permissions.filter(p => !current.includes(p.permission));
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
    };
    const deleteRole = async (role: Role) => {
        const good = await confirm('Are you sure you want to delete this role?');
        if (good) {
            await role.delete();
        }
    };
    const getPermissions = async () => {
        const perms = await Role.getAllPermissions();
        if (perms.isOk()) {
            permissions = perms.value;
        }
    };
    const init = () => {
        getRoles();
        getPermissions();
    };

    Role.on('new', getRoles);
    Role.on('update', getRoles);
    Role.on('delete', getRoles);

    onMount(init);
</script>

<div class="table-responsive">
    <table
        bind:this="{table}"
        class="table">
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
                                color="secondary"
                                deletable="{true}"
                                description="{permission.description || ''}"
                                text="{permission.permission}"
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
                                data-placement="top"
                                data-toggle="tooltip"
                                title="Add permissions to {role.name}"
                                on:click="{() => addPermission(role)}"
                            >
                                <i class="material-icons">add</i>
                            </button>
                            <button
                                class="btn btn-danger tt"
                                data-placement="top"
                                data-toggle="tooltip"
                                title="Delete role {role.name}"
                                on:click="{() => deleteRole(role)}"
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
