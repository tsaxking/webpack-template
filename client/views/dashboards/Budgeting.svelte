<script lang="ts">
    import Main from "../components/main/Main.svelte";
    import Page from "../components/main/Page.svelte";
    import { getOpenPage } from '../../utilities/page';
    import Dashboard from '../pages/Dashboard.svelte'
    import Account from "../pages/account.svelte";

    const groups = [{
        name: 'Home',
        pages: [{
            name: 'dashboard',
            icon: 'home'
        }]
    }];

    let active: string = getOpenPage();
    const domain = 'tatorscout.org'

    const openPage = ({ detail }) => {
        active = detail;
    }

    const navItems = [
    ];

    const accountLinks = [
        // 'account',
        // 'contact',
        // null
    ];

    export let bucketId: string = '';

    let fromDate: Date = new Date();
    let toDate: Date = new Date();
    toDate.setMonth(toDate.getMonth() + 1);

    $: from = new Date(fromDate).toLocaleDateString().split('/').reverse().join('-');
    $: to = new Date(toDate).toLocaleDateString().split('/').reverse().join('-');
</script>




<Main title="Budgeting" {groups} on:openPage={openPage} {active} {navItems} {accountLinks}>
    <Page {active} {domain} title='dashboard'><Dashboard bind:from={from} bind:to={to} bind:active={bucketId}></Dashboard></Page>
</Main>