<script lang="ts">
    import Main from '../components/main/Main.svelte';
    import Page from '../components/main/Page.svelte';
    import { getOpenPage } from '../../utilities/page';
    import Dashboard from '../pages/Dashboard.svelte';
    import Account from '../pages/Account.svelte';
    import type { PageGroup } from '../../utilities/general-types';

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
                    name: 'account',
                    icon: 'person',
                    iconType: 'material'
                }
            ]
        }
    ];

    let active: string = getOpenPage() || 'dashboard';
    const domain = 'tatorscout.org';

    const navItems: string[] = [];

    const accountLinks: string[] = [
    // 'account',
    // 'contact',
    // null
    ];
</script>

<Main
    {accountLinks}
    {active}
    {groups}
    {navItems}
    title="Team Tators"
    on:openPage="{e => (active = e.detail)}"
>
    <Page
        {active}
        {domain}
        title="dashboard"><Dashboard /></Page>
    <Page
        {active}
        {domain}
        title="account"><Account /></Page>
</Main>
