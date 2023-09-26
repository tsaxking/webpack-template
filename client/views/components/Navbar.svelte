<script lang="ts">
    import { Container, Button } from "sveltestrap";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let title: string;

    const openOffcanvas = () => {
        dispatch("openOffcanvas");
    };
</script>




<nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow">
    <Container fluid>
        <div class="d-flex justify-content-space-between w-100">
            <Button on:click={openOffcanvas} color="dark">
                <i class="material-icons">menu</i>
            </Button>
        </div>

        <span class="text-light me-auto">
            <a href="/home" class="navbar-brand fw-bold">{title}</a>&nbsp;
        </span>
        
        <a href="#navbar-links" class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-links" aria-controls="navbar-links" aria-expanded="false" aria-label="Toggle navigation">
            <span class="material-icons">menu</span>
        </a>


        <div class="collapse navbar-collapse" id="navbar-links">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <slot></slot>
            </ul>
        </div>
    </Container>
</nav>