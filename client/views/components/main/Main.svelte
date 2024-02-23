<script lang="ts">
import Offcanvas from './Offcanvas.svelte';
import Navbar from './Navbar.svelte';
import { createEventDispatcher } from 'svelte';
import { capitalize, fromSnakeCase } from '../../../../shared/text';
import { Account } from '../../../models/account';

export let title: string;
export let navItems: string[] = [];
export let accountLinks: (string | null)[] = [];

export let groups = [];
export let active: string;

const openPage = ({ detail }) => {
    document.title =
        capitalize(title) + ': ' + capitalize(fromSnakeCase(detail, '-'));
    // history.pushState({}, '', location.pathname.split('/').slice(0, -1).join('/') + '/' + detail);
};

const dispatch = createEventDispatcher();

if (active) {
    openPage({ detail: active });
}
</script>

<main class="dashboard">
    <Navbar {title} {navItems} {accountLinks}>
        <slot name="nav" />
    </Navbar>

    <Offcanvas
        {groups}
        on:openPage="{e => {
            openPage(e);
            dispatch('openPage', e.detail);
        }}"
        {active}
    ></Offcanvas>

    <slot />
</main>
