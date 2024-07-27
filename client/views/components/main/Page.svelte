<script lang="ts">
import { capitalize, fromSnakeCase } from '../../../../shared/text';
export let title: string;
let year: number = new Date().getFullYear();
export let domain: string;
export let active: string;
</script>

{#if active === title}
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
{/if}
