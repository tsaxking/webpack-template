<script lang="ts">
    import { Permissions } from '../../../../models/permissions';
    import RoleRow from './RoleRow.svelte';

    const u = Permissions.currentUniverse;
    const universe = $u;

    const roleStore = Permissions.Role.fromProperty('universe', universe.id, true);

    const roles = $roleStore;
</script>

<table class="table">
    <thead>
        <tr>
            <th>Role</th>
            <th>Description</th>
            <!-- <th>Permissions</th> -->
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        {#each roles as role (role.id)}
            <RoleRow {role} />
        {/each}
    </tbody>
</table>
