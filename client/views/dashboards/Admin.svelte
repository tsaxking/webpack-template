<script lang="ts">
import Main from '../components/main/Main.svelte';
import Page from '../components/main/Page.svelte';
import { getOpenPage } from '../../utilities/page';
import Dashboard from '../pages/Dashboard.svelte';
import Accounts from '../pages/Accounts.svelte';
import Roles from '../pages/Roles.svelte';

const groups = [
    {
        name: 'Home',
        pages: [
            {
                name: 'dashboard',
                icon: 'home'
            },
            {
                name: 'accounts',
                icon: 'person'
            },
            {
                name: 'roles',
                icon: 'admin_panel_settings'
            }
        ]
    }
];

let active: string = 'dashboard';
const domain = '';

const openPage = ({ detail }) => {
    active = detail;
};

const navItems = ['dashboard', 'accounts', 'roles'];

const accountLinks = [
    // 'account',
    // 'contact',
    // null
];
</script>

<Main
    title="Team Tators"
    {groups}
    on:openPage="{openPage}"
    {active}
    {navItems}
    {accountLinks}
>
    <Page {active} {domain} title="dashboard"><Dashboard></Dashboard></Page>
    <Page {active} {domain} title="accounts"><Accounts></Accounts></Page>
    <Page {active} {domain} title="roles"><Roles></Roles></Page>
</Main>
