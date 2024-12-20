<script lang="ts">
    import { type Blank } from '../../../../shared/struct';
    import { capitalize, fromCamelCase } from '../../../../shared/text';
    import { Permissions } from '../../../models/permissions';
    import PropertyRow from './PropertyRow.svelte';

    export let struct: Permissions.StructPermissions<Blank>;
    const name = struct.struct.name;

    const selectRead = () => {
        struct.update(s => {
            const on = s.properties.every(p => p.data.read);
            if (on) {
                for (const property of s.properties) {
                    property.data.read = false;
                    property.data.update = false;
                }
                canUpdate = false;
                canRead = false;
            } else {
                for (const property of s.properties) {
                    property.data.read = true;
                }
                canRead = true;
            }

            return s;
        });
    };
    const selectUpdate = () => {
        struct.update(s => {
            const on = s.properties.every(p => p.data.update);
            if (on) {
                for (const property of s.properties) {
                    property.data.update = false;
                }
                canUpdate = false;
            } else {
                for (const property of s.properties) {
                    property.data.update = true;
                    property.data.read = true;
                }
                canUpdate = true;
                canRead = true;
            }

            return s;
        });
    };

    type State = boolean | 'indeterminate';

    let canRead: State;
    let canUpdate: State;

    $: {
        const someRead = $struct.properties.some(p => p.data.read);
        const allRead = $struct.properties.every(p => p.data.read);
        canRead = allRead ? true : someRead ? 'indeterminate' : false;

        const someUpdate = $struct.properties.some(p => p.data.update);
        const allUpdate = $struct.properties.every(p => p.data.update);
        canUpdate = allUpdate ? true : someUpdate ? 'indeterminate' : false;
    }
</script>

<table class="table">
    <thead>
        <tr>
            <th />
            <th class="rotate"><div><span>Read</span></div></th>
            <th class="rotate"><div><span>Update</span></div></th>
            <th class="rotate"><div><span>Create</span></div></th>
            <th class="rotate"><div><span>Delete</span></div></th>
            <th class="rotate"><div><span>Read Archive</span></div></th>
            <th class="rotate"><div><span>Archive</span></div></th>
            <th class="rotate"><div><span>Restore Archive</span></div></th>
            <th class="rotate"><div><span>Read Version History</span></div></th>
            <th class="rotate"><div><span>Restore Version</span></div></th>
            <th class="rotate"><div><span>Delete Version</span></div></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{capitalize(fromCamelCase(name))}</td>
            <td>
                <div class="form-check">
                    {#if typeof canRead === 'boolean'}
                        <input
                            id="{struct.struct.name + '-read'}"
                            name="{struct.struct.name + '-read'}"
                            class="form-check-input"
                            checked="{canRead}"
                            role="switch"
                            type="checkbox"
                            on:input="{selectRead}"
                        />
                    {:else}
                        <input
                            id="{struct.struct.name + '-read'}"
                            name="{struct.struct.name + '-read'}"
                            class="form-check-input"
                            checked="{false}"
                            indeterminate="{true}"
                            role="switch"
                            type="checkbox"
                            on:input="{selectRead}"
                        />
                    {/if}
                </div>
            </td>
            <td>
                <div class="form-check">
                    {#if typeof canUpdate === 'boolean'}
                        <input
                            id="{struct.struct.name + '-update'}"
                            name="{struct.struct.name + '-update'}"
                            class="form-check-input"
                            checked="{canUpdate}"
                            role="switch"
                            type="checkbox"
                            on:input="{selectUpdate}"
                        />
                    {:else}
                        <input
                            id="{struct.struct.name + '-update'}"
                            name="{struct.struct.name + '-update'}"
                            class="form-check-input"
                            checked="{false}"
                            indeterminate="{true}"
                            role="switch"
                            type="checkbox"
                            on:input="{selectUpdate}"
                        />
                    {/if}
                </div>
            </td>
            <td>
                <div class="form-check form-switch">
                    <input
                        id="{name}-create"
                        name="{name}-create"
                        class="form-check-input"
                        role="switch"
                        type="checkbox"
                        bind:checked="{$struct.permissions.create}"
                        on:change="{() =>
                            struct.update(s => {
                                s.permissions.create = !s.permissions.create;
                                return s;
                            })}"
                    />
                </div>
            </td>
            <td>
                {#if $struct.permissions.create}
                    <div class="form-check form-switch">
                        <input
                            id="{name}-delete"
                            name="{name}-delete"
                            class="form-check-input"
                            role="switch"
                            type="checkbox"
                            bind:checked="{$struct.permissions.delete}"
                            on:change="{() =>
                                struct.update(s => {
                                    s.permissions.delete =
                                        !s.permissions.delete;
                                    return s;
                                })}"
                        />
                    </div>
                {/if}
            </td>
            <td>
                <div class="form-check form-switch">
                    <input
                        id="{name}-read-archive"
                        name="{name}-read-archive"
                        class="form-check-input"
                        role="switch"
                        type="checkbox"
                        bind:checked="{$struct.permissions['read-archive']}"
                        on:change="{() =>
                            struct.update(s => {
                                s.permissions['read-archive'] =
                                    !s.permissions['read-archive'];
                                return s;
                            })}"
                    />
                </div>
            </td>
            <td>
                {#if $struct.permissions['read-archive']}
                    <div class="form-check form-switch">
                        <input
                            id="{name}-archive"
                            name="{name}-archive"
                            class="form-check-input"
                            role="switch"
                            type="checkbox"
                            bind:checked="{$struct.permissions.archive}"
                            on:change="{() =>
                                struct.update(s => {
                                    s.permissions.archive =
                                        !s.permissions.archive;
                                    return s;
                                })}"
                        />
                    </div>{/if}
            </td>

            <td>
                {#if $struct.permissions['read-archive']}
                    <div class="form-check form-switch">
                        <input
                            id="{name}-restore-archive"
                            name="{name}-restore-archive"
                            class="form-check-input"
                            role="switch"
                            type="checkbox"
                            bind:checked="{$struct.permissions[
                                'restore-archive'
                            ]}"
                            on:change="{() =>
                                struct.update(s => {
                                    s.permissions['restore-archive'] =
                                        !s.permissions['restore-archive'];
                                    return s;
                                })}"
                        />
                    </div>
                {/if}
            </td>

            <td>
                <div class="form-check form-switch">
                    <input
                        id="{name}-read-version-history"
                        name="{name}-read-version-history"
                        class="form-check-input"
                        role="switch"
                        type="checkbox"
                        bind:checked="{$struct.permissions[
                            'read-version-history'
                        ]}"
                        on:change="{() =>
                            struct.update(s => {
                                s.permissions['read-version-history'] =
                                    !s.permissions['read-version-history'];
                                return s;
                            })}"
                    />
                </div>
            </td>

            <td>
                {#if $struct.permissions['read-version-history']}
                    <div class="form-check form-switch">
                        <input
                            id="{name}-restore-version"
                            name="{name}-restore-version"
                            class="form-check-input"
                            role="switch"
                            type="checkbox"
                            bind:checked="{$struct.permissions[
                                'restore-version'
                            ]}"
                            on:change="{() =>
                                struct.update(s => {
                                    s.permissions['restore-version'] =
                                        !s.permissions['restore-version'];
                                    return s;
                                })}"
                        />
                    </div>
                {/if}
            </td>

            <td>
                {#if $struct.permissions['read-version-history']}
                    <div class="form-check form-switch">
                        <input
                            id="{name}-delete-version"
                            name="{name}-delete-version"
                            class="form-check-input"
                            role="switch"
                            type="checkbox"
                            bind:checked="{$struct.permissions[
                                'delete-version'
                            ]}"
                            on:change="{() =>
                                struct.update(s => {
                                    s.permissions['delete-version'] =
                                        !s.permissions['delete-version'];
                                    return s;
                                })}"
                        />
                    </div>
                {/if}
            </td>
        </tr>
        {#each $struct.properties as p (p.data.property)}
            <PropertyRow
                structName="{name}"
                bind:property="{p}" />
        {/each}
    </tbody>
</table>

<style>
th.rotate {
    white-space: nowrap;
    height: 140px;
}

th.rotate > div {
    transform: translate(25px, 51px) rotate(270deg);
    width: 30px;
}

th.rotate > div > span {
    border-bottom: 1px solid var(--bs-light);
    padding: 5px 10px;
}
</style>
