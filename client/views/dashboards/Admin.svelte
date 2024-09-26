<script lang="ts">
    import Main from '../components/main/Main.svelte';
    import Page from '../components/main/Page.svelte';
    import Dashboard from '../pages/Dashboard.svelte';
    import Accounts from '../pages/Accounts.svelte';
    import Roles from '../pages/Roles.svelte';
    import type { PageGroup } from '../../utilities/general-types';
    import { getOpenPage } from '../../utilities/page';

    const groups: PageGroup[] = [
        {
            name: 'Home',
            pages: [
                {
                    name: 'dashboard',
                    icon: 'home',
                    iconType: 'material'
                },
                {
                    name: 'accounts',
                    icon: 'person',
                    iconType: 'material'
                },
                {
                    name: 'roles',
                    icon: 'admin_panel_settings',
                    iconType: 'material'
                }
            ]
        }
    ];

    let active: string = getOpenPage() || 'dashboard';
    const domain = '';

    const navItems: string[] = [];

    const accountLinks: string[] = [
    // 'account',
    // 'contact',
    // null
    ];

    let loading = false;
</script>

<Main
    {accountLinks}
    {groups}
    {navItems}
    title="Team Tators"
    bind:active
    on:openPage="{e => (active = e.detail)}"
>
    <Page
        {active}
        {domain}
        title="dashboard"
        bind:loading><Dashboard /></Page>
    <Page
        {active}
        {domain}
        title="accounts"
        bind:loading><Accounts /></Page>
    <Page
        {active}
        {domain}
        title="roles"
        bind:loading><Roles /></Page>
</Main>
