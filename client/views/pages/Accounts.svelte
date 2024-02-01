<script lang="ts">
import { onMount } from 'svelte';
import { Account } from '../../models/account';
import type { Role, Permission } from '../../../shared/db-types';
import { alert, prompt, choose, select } from '../../utilities/notifications';

let accounts: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    verified: 0 | 1;
    created: number;
    phoneNumber: string;
    picture?: string;
    roles: Role[];
    permissions: Permission[];
}[] = [];

const fns = {
    setAccounts: async (newAccounts: Account[]) => {
        accounts = await Promise.all(
            newAccounts.map(async a => {
                const [roles, permissions] = await Promise.all([
                    a.getRoles().then(r => (r.isOk() ? r.value : [])),
                    a.getPermissions().then(p => (p.isOk() ? p.value : []))
                ]);

                return {
                    id: a.id,
                    username: a.username,
                    firstName: a.firstName,
                    lastName: a.lastName,
                    email: a.email,
                    verified: a.verified,
                    created: a.created,
                    phoneNumber: a.phoneNumber,
                    picture: a.picture,
                    roles,
                    permissions
                };
            })
        );
    }
};

onMount(async () => {
    const res = await Account.all();

    if (res.isOk()) {
        fns.setAccounts(res.value);
    }
});
</script>

<div class="table-responsive">
    <table class="table table-striped table-dark table-hover">
        <thead>
            <tr>
                <th scope="col">Username</th>
                <th scope="col">Email</th>
                <th scope="col">Roles</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each accounts as account}
                <tr>
                    <td>
                        {account.username}
                        {#if account.verified}
                            <span class="badge bg-success ms-1">
                                <i class="material-icons">verified</i>
                            </span>
                        {:else}
                            <span class="badge bg-warning ms-1">
                                <i class="material-icons">dangerous</i>
                            </span>
                        {/if}
                    </td>
                    <td>{account.email}</td>
                    <td>
                        {#each account.roles as role}
                            <span class="badge bg-primary me-1"
                                >{role.name}</span
                            >
                        {/each}
                    </td>
                    <td>
                        <div class="btn-group">
                            <button
                                type="button"
                                class="btn btn-primary"
                                on:click="{async () => {}}"
                            >
                                <i class="material-icons">add</i>
                                Add Role
                            </button>
                            {#if account.verified}
                                <button type="button" class="btn btn-warning">
                                    <i class="material-icons">warning</i>
                                    Verify
                                </button>
                            {:else}
                                <button type="button" class="btn btn-success">
                                    <i class="material-icons">verified</i>
                                    Unverify
                                </button>
                            {/if}
                            <button type="button" class="btn btn-danger">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
