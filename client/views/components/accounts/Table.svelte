<script lang="ts">
    import { onMount } from 'svelte';
    import { Accounts } from '../../../models/account';
    import TableAccountRow from './TableAccountRow.svelte';

    const all = Accounts.Account.all(true);

    let table: HTMLTableElement;

// onMount(() => {
//     jQuery(table).DataTable();

//     return () => {};
// });
</script>

<table
    bind:this="{table}"
    class="table">
    <thead>
        <tr>
            <th>Username</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Picture</th>
            <th>Universes</th>
            <th>Verified</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        {#each $all as account (account.id)}
            <TableAccountRow {account} />
        {/each}
    </tbody>
</table>
