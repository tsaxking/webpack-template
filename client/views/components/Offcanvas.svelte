
<script lang="ts">
    import { Offcanvas, ListGroup, ListGroupItem } from 'sveltestrap';
    export let isOpen = false;
    const open = () => isOpen = true;
    const close = () => isOpen = false;
    const toggle = () => isOpen = !isOpen;
</script>





<!-- <div class="offcanvas offcanvas-start bg-dark text-white sidebar-nav shadow">
    <div class="offcanvas-body p-0">
        <nav class="navbar-dark">
            <ul class="navbar-nav">
                <slot></slot>
            </ul>
        </nav>
    </div> -->
<!-- </div> -->

<div class="bg-dark text-white sidebar-nav shadow">
    <Offcanvas
        {toggle}
        bind:isOpen
        backdrop={true}
    >
        <nav class="navbar-dark" slot="body">
            <ul class="navbar-nav">
                <slot></slot>
            </ul>
        </nav>
    </Offcanvas>
</div>  