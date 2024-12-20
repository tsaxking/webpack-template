<script lang="ts">
    import { Blank } from '../../../../shared/struct';
    import { capitalize, fromCamelCase } from '../../../../shared/text';
    import { Permissions } from '../../../models/permissions';

    export let property: Permissions.StructProperty<Blank>;
    export let structName: string;

    const name = property.data.property;
    let read = false;
    let update = false;

    $: {
        read = $property.read;
        update = $property.update;
    }
</script>

<tr>
    <td
    >{capitalize(fromCamelCase(structName))} - {capitalize(
        fromCamelCase(String(name))
    )}</td
    >
    <td>
        <div class="form-check form-switch">
            <input
                id="role-editor-{structName}-{name}-read"
                class="form-check-input"
                type="checkbox"
                bind:checked="{read}"
                on:change="{() => {
                    if (!read) update = false;

                    property.set({
                        read,
                        update,
                        property: name
                    });
                }}"
            />
        </div>
    </td>
    <td>
        <div class="form-check form-switch">
            <input
                id="role-editor-{structName}-{name}-update"
                class="form-check-input"
                type="checkbox"
                bind:checked="{update}"
                on:change="{() => {
                    if (update) read = true;

                    property.set({
                        read,
                        update,
                        property: name
                    });
                }}"
            />
        </div>
    </td>
</tr>
