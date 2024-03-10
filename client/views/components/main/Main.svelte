<script lang="ts">
import Offcanvas from './Offcanvas.svelte';
import Navbar from './Navbar.svelte';
import { createEventDispatcher } from 'svelte';
import { capitalize, fromSnakeCase } from '../../../../shared/text';
import { Account } from '../../../models/account';
import type { PageGroup } from '../../../utilities/general-types';
import { getOpenPage } from '../../../utilities/page';

export let title: string;
export let navItems: string[] = [];
export let accountLinks: (string | null)[] = [];

export let groups: PageGroup[] = [];
export let active: string;

const openPage = (page: string) => {
    if (!page) return console.error('No page provided!');

    document.title =
        capitalize(title) + ': ' + capitalize(fromSnakeCase(page, '-'));

    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url.href);
    d('openPage', page);
};

const d = createEventDispatcher();

$: openPage(active);
</script>

<main class="dashboard">
    <Navbar {title} {navItems} {accountLinks}>
        <slot name="nav" />
    </Navbar>

    <Offcanvas
        {groups}
        on:openPage="{e => {
            active = e.detail;
        }}"
        {active}
    ></Offcanvas>

    <slot />
</main>
