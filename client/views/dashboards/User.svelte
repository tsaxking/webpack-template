<script lang="ts">
    import Main from "../components/main/Main.svelte";
    import Page from "../components/main/Page.svelte";
    import { getOpenPage } from '../../utilities/page';
    import Dashboard from '../pages/Dashboard.svelte'

    const groups = [{
        name: 'Home',
        pages: [{
            name: 'dashboard',
            icon: 'home'
        },{
            name: 'account',
            icon: 'person'
        },{
            name: 'users',
            icon: 'people'
        },{
            name: 'contact',
            icon: 'phone'
        }, {
            name: 'logout',
            icon: 'logout'
        }]
    }];

    let active: string = getOpenPage();
    const domain = 'tatorscout.org'

    const openPage = ({ detail }) => {
        active = detail;
    }

    const navItems = [
        'app'
    ];
</script>




<Main title="Team Tators" {groups} on:openPage={openPage} {active} {navItems}>
    <Page {active} {domain} title='dashboard'><Dashboard></Dashboard></Page>
    <Page {active} {domain} title='account'></Page>
    <Page {active} {domain} title='users'></Page>
    <Page {active} {domain} title='contact'></Page>
    <Page {active} {domain} title='logout'></Page>
</Main>