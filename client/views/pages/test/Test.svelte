<script lang="ts">
    import { type SType, testStruct } from '../../../entries/test/struct-testing';
    import TestEach from './TestEach.svelte';

    const all = testStruct.all(true);

    const add = () => {
        testStruct.new({
            name: 'Test' + Math.random(),
            age: Math.floor(Math.random() * 100)
        });
    };
    const remove = (data: SType) => {
        data.delete();
    };
</script>

<button
    class="btn btn-primary"
    type="button"
    on:click="{add}"> Add </button>

{#each $all as item (item.id)}
    <TestEach
        onRemove="{remove}"
        bind:data="{item}" />
{/each}
