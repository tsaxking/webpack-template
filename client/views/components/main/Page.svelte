<script lang="ts">
    import { capitalize, fromSnakeCase } from '../../../../shared/text';
    import { fade } from 'svelte/transition';
    export let title: string;
    let year: number = new Date().getFullYear();
    export let domain: string;
    export let active: string;
    export let loading: boolean = false;
</script>

{#if active === title}
    {#if loading}
        <div
            class="loading"
            transition:fade>
            <div class="text-center">
                <div
                    class="spinner-border"
                    role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading teams</p>
            </div>
        </div>
    {/if}
    <div
        style:opacity="{loading ? 0 : 1}"
        transition:fade>
        <div class="container-fluid p-3">
            {#if !title.startsWith('--$')}
                <h1 class="no-select p-5">
                    {capitalize(fromSnakeCase(title, '-'))}
                </h1>
                <hr class="dropdown-divider" />
            {/if}
            <slot />
            <p class="text-muted text-center">
                &copy; {year}
                {domain} | All Rights Reserved
            </p>
        </div>
    </div>
{/if}
