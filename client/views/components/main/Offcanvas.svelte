<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { capitalize, fromSnakeCase } from '../../../../shared/text';
import type { PageGroup, PageObj } from '../../../utilities/general-types';
export let isOpen = false;

export let groups: PageGroup[] = [];

const dispatch = createEventDispatcher();

export let active: string;

const openPage = (page: string) => {
    jQuery('#sidebar-nav').offcanvas('hide');

    dispatch('openPage', page);
};
</script>

<div
    class="{(isOpen ? 'show ' : '') +
        'offcanvas offcanvas-start bg-dark text-white sidebar-nav shadow'}"
    id="sidebar-nav"
>
    <div class="offcanvas-body p-0">
        <nav class="navbar-dark">
            <ul class="navbar-nav">
                {#each groups as group}
                    <li>
                        <h5
                            class="text-secondary px-3 text-capitalize no-select"
                        >
                            {group.name}
                        </h5>
                    </li>
                    {#each group.pages as page}
                        <li class="nav-item">
                            <a
                                class="{(active === page.name
                                    ? ' active'
                                    : '') + ' nav-link ms-5'}"
                                href="/{page.name}"
                                on:click|preventDefault="{() =>
                                    openPage(page.name)}"
                            >
                                {#if page.iconType === 'material'}
                                    <i class="material-icons">{page.icon}</i>
                                {:else if page.iconType === 'fontawesome'}
                                    <i class="fa fa-{page.icon}"></i>
                                {:else if page.iconType === 'bootstrap'}
                                    <i class="bi bi-{page.icon}"></i>
                                {/if}
                                <span class="ms-2"
                                    >{capitalize(
                                        fromSnakeCase(page.name, '-')
                                    )}</span
                                >
                            </a>
                        </li>
                    {/each}
                {/each}
            </ul>
        </nav>
    </div>
</div>
