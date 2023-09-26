<script lang="ts" context="module">
    import Page from './Page.svelte';
    import Offcanvas from './Offcanvas.svelte';
    import { toSnakeCase } from '../../../shared/text';
    import Navbar from './Navbar.svelte';
    import { SvelteComponent } from 'svelte';

    type PageGroup = {
        name: string;
        pages: PageObj[];
    }

    type PageObj = {
        name: string;
        icon: string;
        component: SvelteComponent;
    }

    export let groups: PageGroup[] = [];



    export const addPage = (group: string, page: PageObj) => {
        let g = groups.find(g => g.name === group);
        if (!g) {
            addPageGroup(group);
            g = groups[groups.length - 1];
        }

        g.pages = [...g.pages, page];
        groups = [...groups];
    }


    const addPageGroup = (group: string) => {
        groups = [...groups, { name: group, pages: [] }];
    }

    let isOpen = false;

    const openOffcanvas = () => {
        isOpen = true;
    }

    const closeOffcanvas = () => {
        isOpen = false;
    }

    let domain = 'teamtators.org';
</script>







<main>
    <Navbar on:openOffcanvas={openOffcanvas} title="Team Tators">
        
    </Navbar>



    <Offcanvas {isOpen}>
        {#each groups as group}
                <li>
                    <h5 class="text-muted px-3 text-capitalize no-select">{group.name}</h5>
                </li>
                {#each group.pages as page}
                    <li>
                        <a href="/{toSnakeCase(page.name)}" class="nav-link px-5 toggle-elements no-select">
                            <span class="me-2">
                                <i class="material-icons">{page.icon}</i>
                                <span>{page.name}</span>
                            </span>
                        </a>
                    </li>
                {/each}
        {/each}
    </Offcanvas>



    <!-- <div> -->
        {#each groups as group}
            {#each group.pages as page} 
                <Page title={page.name} {domain}>
                    {page.component}
                </Page>
            {/each}
        {/each}
    <!-- </div> -->
</main>