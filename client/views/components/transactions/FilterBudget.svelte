<script lang="ts">
    import NavTabs from "../bootstrap/NavTabs.svelte";
    import NewBucket from "../buckets/NewBucket.svelte";
    import EditBucket from "../buckets/EditBucket.svelte";
    import { createEventDispatcher } from "svelte";
    import { months, currentMonth, currentYear } from "../../../utilities/clock";
    import Button from "../bootstrap/Button.svelte";
    import { Bucket } from "../../../models/transactions/bucket";
    import $ from 'jquery';


    const dispatch = createEventDispatcher();

    export let buckets: string[] = [];
    export let active: string = '';
    export let search: string = '';
    export let from: number;
    export let to: number;

    export let fromTo: string = '';

    const setFromTo = () => {
        const [month, year] = fromTo.split('-');

        if (!month) {
            from = new Date(+year, 0, 1).getTime();
            to = new Date(+year, 11, 31).getTime();
        } else {
            from = new Date(+year, months.indexOf(month), 1).getTime();
            to = new Date(+year, months.indexOf(month) + 1, 0).getTime();
        }

        emitSearch();
    };

    const startYear = 2020;
    const endMonth = currentMonth();
    const endYear = currentYear();

    const years = Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);

    const emitSearch = () => dispatch('search', { search, from, to });

</script>

<div class="container">
    <div class="row">
        <div class="col-9">
            <NavTabs bind:tabs={buckets} bind:active={active} on:change={() => dispatch('changeBucket', active)}/>
        </div>
        <div class="col-3">
            <Button on:click={() => $('#new-bucket').modal('open')}>
                <i class="material-icons">add_box</i>
            </Button>
        </div>
    </div>
    <div class="row">
        <div class="col-md-4">
            <input type="text" class="form-control" name="search-bucket" placeholder="search" bind:value={search} on:change={() => dispatch('search', { search, from, to })}>
        </div>
        <div class="col-md-4">
            <div class="input-group">
                <input type="date" name="from" bind:value={from} on:change={emitSearch}>
                <input type="date" name="to" bind:value={to} on:change={emitSearch}>
                <select name="set-from-to" bind:value={fromTo} on:change={setFromTo}>
                    {#each years as year}
                        <option value="-{year}">{year}</option>
                        {#each months as month}
                            {#if (year !== endYear && months.indexOf(month) <= months.indexOf(endMonth))}
                                <option value={month + '-' + year}>{month + ' ' + year}</option>
                            {/if}
                        {/each}
                    {/each}
                </select>
            </div>
        </div>
    </div>
</div>

<NewBucket id={"new-bucket"}/>
<EditBucket id="edit-bucket" bucket={Bucket.cache.get(active)}/>