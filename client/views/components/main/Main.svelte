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

    const d = createEventDispatcher();

    const openPage = (page: string) => {
        if (!page) return console.error('No page provided!');

        document.title =
            capitalize(title) + ': ' + capitalize(fromSnakeCase(page, '-'));

        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url.href);
        d('openPage', page);
    };

    $: openPage(active);
</script>

<main class="dashboard">
    <Navbar
        {accountLinks}
        {navItems}
        {title}>
        <slot name="nav" />
    </Navbar>

    <Offcanvas
        {active}
        {groups}
        on:openPage="{e => {
            active = e.detail;
        }}"
    />

    <slot />
</main>
