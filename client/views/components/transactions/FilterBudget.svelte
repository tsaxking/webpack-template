<script lang="ts">
    import NavTabs from "../bootstrap/NavTabs.svelte";
    import { createEventDispatcher } from "svelte";

    export let buckets: string[] = [];
    export let active: string = '';
    export let search: string = '';
    export let from: string = '';
    export let to: string = '';

    const setFromTo = () => {};

</script>

<NavTabs bind:tabs={buckets} bind:active={active}/>
<div class="container">
    <div class="row">
        <div class="col-md-4">
            <input type="text" class="form-control" name="search-bucket" placeholder="search" bind:value={search}>
        </div>
        <div class="col-md-4">
            <div class="input-group">
                <input type="date" name="from" bind:value={from}>
                <input type="date" name="to" bind:value={to}>
                <select name="set-from-to" on:change={setFromTo}>
                    
                </select>
            </div>
        </div>
    </div>
</div>