<script lang="ts">
    import { type SQL_Type, type TS_Type } from '../../../../shared/struct';
    import { confirm } from '../../../utilities/notifications';

    export let type: SQL_Type;
    export let data: TS_Type<SQL_Type>;
    export let onChange: (value: TS_Type<SQL_Type>) => void;

    // Svelete did not like the type being passed in as a prop for the boolean case
    let boolData: boolean;
    $: if (type === 'boolean') {
        boolData = data as boolean;
    }

    const doChange = async (
        event: Event & {
            currentTarget: HTMLInputElement;
        }
    ) => {
        const value = event.currentTarget.value as TS_Type<SQL_Type>;
        const sure = await confirm(`Change value from ${data} to ${value}?`);
        if (sure) {
            onChange(value);
            data = value;
        }
    };

// let tsType = tsTypeActual(type);
</script>

{#if type === 'text'}
    <input
        type="text"
        value="{data}"
        on:change="{doChange}" />
{:else if type === 'integer'}
    <input
        step="1"
        type="number"
        value="{data}"
        on:change="{doChange}" />
{:else if type === 'real'}
    <input
        step="0.0001"
        type="number"
        value="{data}"
        on:change="{doChange}" />
{:else if type === 'boolean'}
    <input
        checked="{boolData}"
        type="checkbox"
        on:change="{doChange}" />
    <!-- {:else if type === 'date'}
    <input type="date" value={data} on:change={onChange} />
{:else if type === 'time'}
    <input type="time" value={data} on:change={onChange} />
{:else if type === 'timestamp'}
    <input type="datetime-local" value={data} on:change={onChange} />
{:else if type === 'enum'}
    <select value={data} on:change={onChange}>
        {#each tsType as option (option)}
            <option value={option}>{option}</option>
        {/each}
    </select>
{:else if type === 'json'}
    <textarea value={data} on:change={onChange}></textarea>
{:else} -->
    <input
        type="text"
        value="{data}"
        on:change="{doChange}" />
{/if}

<!-- {#if checkStrType(type) === 'array'}
    <button on:click={() => data.push(returnType(type))}>Add</button>
    {#each data as item, i (item)}
        <RowInput type={type[0]} data={item} header={header} onChange={value => data[i] = value} />
    {/each}
{/if} -->
