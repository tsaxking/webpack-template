<script lang="ts">
    import Button from "./Button.svelte";

    export let picture: string | undefined = undefined;
    export let title: string;
    export let footer: boolean = false;
    export let classes: string = '';

    export let hidable: boolean = false;

    export let hidden: boolean = false;
</script>


<div class="card {classes}">
    <div class="card-header">
        <div class="d-flex align-items-center">
            {#if (hidable)}
                {#if (hidden)}
                    <Button color="secondary" outline={true} on:click={() => hidden = false}>
                        <i class="material-icons">expand_more</i>
                    </Button>
                {:else} 
                    <Button color="secondary" outline={true} on:click={() => hidden = true}>
                        <i class="material-icons">expand_less</i>
                    </Button>
                {/if}
            {/if}
            <h5 class="card-title ms-3 my-auto">{title}</h5>
            <slot name="header"></slot>
        </div>
    </div>
    {#if (picture && !hidden)}
        <img src="{picture}" class="card-img-top" alt="...">
    {/if}
    {#if (!hidden)}
        <div class="card-body">
            <slot name="body"></slot>
            <slot name="button"></slot>
        </div>
    {/if}
    {#if (footer)}
        <div class="card-footer">
            <slot name="footer"></slot>
        </div>
    {/if}
</div>