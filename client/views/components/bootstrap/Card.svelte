<script lang="ts">
    export let picture: string | undefined;
    export let title: string;
    export let footer: boolean = false;
    export let classes: string = '';
</script>


<div class="card {classes}">
    <div class="card-header">
        <h5 class="card-title">{title}</h5>
    </div>
    {#if (picture)}
        <img src="{picture}" class="card-img-top" alt="...">
    {/if}
    <div class="card-body">
        <slot></slot>
        <slot name="button"></slot>
    </div>
    {#if (footer)}
        <div class="card-footer">
            <slot name="footer"></slot>
        </div>
    {/if}
</div>