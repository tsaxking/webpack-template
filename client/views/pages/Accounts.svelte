<script lang="ts">
import { onMount } from 'svelte';
import { Account } from '../../models/account';
import type { Permission as P } from '../../../shared/permissions';
import { prompt, select } from '../../utilities/notifications';
import { Role } from '../../models/roles';

let accounts: Account[] = [];

let accountObjs: {
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
    permissions: P[];
}[] = [];

const fns = {
    setAccounts: async (newAccounts: Account[]) => {
        accountObjs = await Promise.all(
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
        accounts = res.value;
    }
});

$: fns.setAccounts(accounts);
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
            {#each accountObjs as account}
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
                            <span class="badge bg-primary me-1">
                                <i class="material-icons">close</i>
                                {role.name}
                            </span>
                        {/each}
                    </td>
                    <td>
                        <div class="btn-group">
                            <button
                                type="button"
                                class="btn btn-primary"
                                on:click="{async () => {
                                    const res = await Role.all();
                                    if (res.isOk()) {
                                        const roles = res.value;
                                        const selected = await select(
                                            'Select a role to add',
                                            roles
                                                .filter(
                                                    r =>
                                                        !account.roles.some(
                                                            ar => ar.id === r.id
                                                        )
                                                )
                                                .map(r => r.name)
                                        );

                                        const role = roles[selected];

                                        if (role) {
                                            const a = accounts.find(
                                                a => a.id === account.id
                                            );
                                            a.addRole(role);
                                        }
                                    }
                                }}"
                            >
                                <i class="material-icons">add</i>
                                Add Role
                            </button>
                            {#if account.verified}
                                <button
                                    type="button"
                                    class="btn btn-warning"
                                    on:click="{() => {
                                        const res = prompt(
                                            'Are you sure you want to unverify this account?'
                                        );
                                        if (res) {
                                            const a = accounts.find(
                                                a => a.id === account.id
                                            );
                                            a.unverify();
                                        }
                                    }}"
                                >
                                    <i class="material-icons">warning</i>
                                    Unverify
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    class="btn btn-success"
                                    on:click="{() => {
                                        const res = prompt(
                                            'Are you sure you want to verify this account?'
                                        );
                                        if (res) {
                                            const a = accounts.find(
                                                a => a.id === account.id
                                            );
                                            a.verify();
                                        }
                                    }}"
                                >
                                    <i class="material-icons">verified</i>
                                    Verify
                                </button>
                            {/if}
                            <button
                                type="button"
                                class="btn btn-danger"
                                on:click="{() => {
                                    const res = prompt(
                                        'Are you sure you want to delete this account?'
                                    );
                                    if (res) {
                                        const a = accounts.find(
                                            a => a.id === account.id
                                        );
                                        a.delete();
                                    }
                                }}"
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
