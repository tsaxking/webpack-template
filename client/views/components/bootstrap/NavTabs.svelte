<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let tabs: string[] = [];
    export let active: string = '';
</script>




<ul class="nav nav-tabs">
    {#each tabs as tab}
        <li class="nav-item">
            <a class="nav-link {tab === active ? 'active' : ''}" href="#{tab}" on:click|preventDefault={() => dispatch('change', tab)
            }>{tab}</a>
        </li>
    {/each}
</ul>