<script lang="ts">
import Main from '../components/main/Main.svelte';
import Page from '../components/main/Page.svelte';
import { getOpenPage } from '../../utilities/page';
import Dashboard from '../pages/Dashboard.svelte';
import Account from '../pages/account.svelte';
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
    title="Team Tators"
    {groups}
    on:openPage="{e => (active = e.detail)}"
    {active}
    {navItems}
    {accountLinks}
>
    <Page {active} {domain} title="dashboard"><Dashboard></Dashboard></Page>
    <Page {active} {domain} title="account"><Account></Account></Page>
</Main>
