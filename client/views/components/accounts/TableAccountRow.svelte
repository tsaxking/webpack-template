<script lang="ts">
    import { onMount } from 'svelte';
    import { typeValidation } from '../../../../shared/struct';
    import { capitalize } from '../../../../shared/text';
    import { Accounts } from '../../../models/account';
    import { StructData } from '../../../models/struct';
    import ButtonGroup from '../bootstrap/ButtonGroup.svelte';
    import RowInput from '../structs/RowInput.svelte';
    import UniverseBadge from '../structs/UniverseBadge.svelte';

    export let account: Accounts.AccountData;

    const universeRes = account.getUniverses();
    let universes: string[] | undefined = [];

    universes = $universeRes || undefined;

    const onDataChange = async (
        header: keyof typeof account.struct.data.structure,
        d: unknown
    ) => {
        const type = account.struct.data.structure[header];
        if (!typeValidation(type, d)) {
            console.error('Invalid type. Needs', type, 'but recieved', d);
            return;
        }

        const res = await account.update(data => ({
            [header]: d
        }));

        if (res.isOk()) {
            console.log('Updated', header, 'to', d);
        } else {
            console.error('Failed to update', header, 'to', d, res.error);
        }
    };

    const cantRead = '[Invalid Permissions]';
</script>

<tr>
    <td>
        {#if $account.username !== undefined}
            <RowInput
                data="{$account.username}"
                onChange="{d => {
                    onDataChange('username', d);
                }}"
                type="text"
            />
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        {#if $account.firstName !== undefined}
            <RowInput
                data="{$account.firstName}"
                onChange="{d => {
                    onDataChange('firstName', d);
                }}"
                type="text"
            />
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        {#if $account.lastName !== undefined}
            <RowInput
                data="{$account.lastName}"
                onChange="{d => {
                    onDataChange('lastName', d);
                }}"
                type="text"
            />
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        {#if $account.email !== undefined}
            <RowInput
                data="{$account.email}"
                onChange="{d => {
                    onDataChange('email', d);
                }}"
                type="text"
            />
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        <!-- TODO: Account picture change -->
        {#if $account.picture !== undefined}
            <img
                alt="Cannot display Image"
                src="{$account.picture}" />
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        {#if universes}
            {#if universes.length > 0}
                {#each universes as universe}
                    <UniverseBadge
                        {account}
                        {universe} />
                {/each}
            {:else}
                No Universes
            {/if}
            <!-- <span
                class="badge bg-primary me-1"
                data-placement="top"
                data-toggle="tooltip"
                title="Add Universe"
            >
                <i class="material-icons cursor-pointer text-sm"
                    on:click={addUniverse}
                >
                    add
                </i>
            </span> -->
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        {#if typeof $account.verified === 'boolean'}
            {#if $account.verified}
                <i class="material-icons text-success">verified</i>
            {:else}
                <i class="material-icons text-warning">warning</i>
            {/if}
        {:else}
            {cantRead}
        {/if}
    </td>
    <td>
        <ButtonGroup>
            <!-- <button class="btn btn-info">Add Universe</button> -->
            <button
                class="btn btn-danger"
                type="button">
                <i class="material-icons"> delete </i>
            </button>
            {#if $account.verified}
                <button
                    class="btn btn-warning"
                    data-bs-title="Unverify Account {$account.username}"
                    data-bs-toggle="tooltip"
                    type="button"
                    on:click="{() => {
                        onDataChange('verified', false);
                    }}"
                >
                    <i class="material-icons"> warning </i>
                </button>
            {:else}
                <button
                    class="btn btn-success"
                    data-bs-title="Verify Account {$account.username}"
                    data-bs-toggle="tooltip"
                    type="button"
                    on:click="{() => {
                        onDataChange('verified', true);
                    }}"
                >
                    <i class="material-icons"> verified </i>
                </button>
            {/if}
        </ButtonGroup>
    </td>
</tr>
