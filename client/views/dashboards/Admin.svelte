<script lang="ts">
import Main from '../components/main/Main.svelte';
import Page from '../components/main/Page.svelte';
import { getOpenPage } from '../../utilities/page';
import Dashboard from '../pages/Dashboard.svelte';

const groups = [
    {
        name: 'Home',
        pages: [
            {
                name: 'dashboard',
                icon: 'home'
            },
            {
                name: 'account',
                icon: 'person'
            }
        ]
    }
];

let active: string = getOpenPage();
const domain = '';

const openPage = ({ detail }) => {
    active = detail;
};

const navItems = [];

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
</Main>
