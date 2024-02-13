<script lang="ts">
import { Role } from "../../models/roles";


    let roles: Role[] = [];




    const fns = {
        getRoles: async () => {
            const res = await Role.all(true);
            if (res.isOk()) {
                // console.log('Roles', res.value);
                roles = res.value;
            }
        }
    };

    Role.on('new', fns.getRoles);
    Role.on('update', fns.getRoles);
    Role.on('delete', fns.getRoles);

    fns.getRoles();
</script>

<div class="table-responsive">
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Permissions</th>
                <th>Rank</th>
            </tr>
        </thead>
        <tbody>
            {#each roles as role}
                <tr>
                    <td>{role.name}</td>
                    <td>
                        {#each role.permissions as permission}
                            <div>{permission}</div>
                        {/each}
                    </td>
                    <td>{role.rank}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>