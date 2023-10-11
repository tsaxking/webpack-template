<script lang="ts">
    import NavTabs from "../bootstrap/NavTabs.svelte";
    import NewBucket from "../buckets/NewBucket.svelte";
    import EditBucket from "../buckets/EditBucket.svelte";
    import { createEventDispatcher } from "svelte";
    import { months, currentMonth, currentYear, formatDate } from "../../../utilities/clock";
    import { Bucket } from "../../../models/transactions/bucket";
    import { confirm } from "../../../utilities/notifications";


    const dispatch = createEventDispatcher();
    const formatter = formatDate('YYYY-MM-DD');

    export let buckets: string[] = [];
    export let active: string = '';
    export let search: string = '';
    export let from: string;
    export let to: string;

    export let fromTo: string = '';

    const setFromTo = () => {
        const [month, year] = fromTo.split('-');

        if (!month) {
            from = formatter(new Date(+year, 0, 1));
            to = formatter(new Date(+year, 11, 31));
        } else {
            from = formatter(new Date(+year, months.indexOf(month), 1));
            to = formatter(new Date(+year, months.indexOf(month) + 1, 0));
        }

        emitSearch();
    };

    const startYear = 2020;
    const endMonth = currentMonth();
    const endYear = currentYear() + 1;

    const years = Array.from({length: endYear - startYear}, (_, i) => startYear + i);

    const emitSearch = () => dispatch('search', { search, from, to });

    const getAll = () => {
        Bucket.getAll().then((b) => {
            buckets = b.map((bucket) => bucket.name);

            if (!active) {
                active = buckets[0];
            }
            dispatch('search', { search, from, to });
        });
    };

    Bucket.on('*', getAll);

    getAll();
</script>

<div class="container-fluid">
    <div class="row">
        <div class="col-9">
            <NavTabs bind:tabs={buckets} bind:active={active} on:change={({ detail }) => {
                active = detail;
                dispatch('changeBucket', active);
            }}/>
        </div>
        <div class="col-3">
            <div class="btn-group">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#new-bucket">
                    <i class="material-icons">add_box</i>
                </button>
                <button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#new-bucket">
                    <i class="material-icons">edit</i>
                </button>
                <button type="button" class="btn btn-outline-danger" on:click={() => confirm('Are you sure you want to delete this bucket?').then((data) => {
                    if (data) {
                        const b = Bucket.cache.get(active);
                        if (b) {
                            b.archive();
                        }
                    }
                })}>
                    <i class="material-icons">delete</i>
                </button>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-4">
            <input type="text" class="form-control" name="search-bucket" placeholder="search" bind:value={search} on:change={() => dispatch('search', { search, from, to })}>
        </div>
        <div class="col-md-4">
            <div class="input-group">
                <input type="date" name="from" class="form-control" bind:value={from} on:change={emitSearch}>
                <input type="date" name="to" class="form-control" bind:value={to} on:change={emitSearch}>
                <select name="set-from-to" class="form-select" bind:value={fromTo} on:change={setFromTo}>
                    {#each years.slice().reverse() as year}
                        <option value="-{year}">{year}</option>
                        {#each months.slice().reverse() as month}
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

<NewBucket id="new-bucket"/>
<EditBucket id="edit-bucket" bucket={Bucket.cache.get(active)}/>