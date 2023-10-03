<script lang="ts">
    import { capitalize, fromSnakeCase } from '../../../../shared/text';
    export let title: string;
    export let navItems: string[] = [];

    export let active: string = '';
</script>




<nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow text-light d-flex" id="top-navbar">
    <button class="btn btn-dark navbar-toggler" type="button" data-bs-toggle="offcanvas" aria-controls="side-bar-nav" data-bs-target="#side-bar-nav">
        <i class="material-icons">menu</i>
    </button>



    <span class="text-light px-3">
        <a href="/home" class="navbar-brand fw-bold">{title}</a>&nbsp;
    </span>

    
    <a href="#navbar-links" class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-links" aria-controls="navbar-links" aria-expanded="false" aria-label="Toggle navigation">
        <span class="material-icons">menu</span>
    </a>


    <div class="collapse navbar-collapse" id="navbar-links">
        <ul class="navbar-nav mb-2 mb-lg-0">
            {#each navItems as item}
                <li class="nav-item">
                    <a class={item === active ? 'nav-link active' : 'nav-link'} href="/{item}">{capitalize(fromSnakeCase(item, '-'))}</a>
                </li>
            {/each}
        </ul>
    </div>
</nav>