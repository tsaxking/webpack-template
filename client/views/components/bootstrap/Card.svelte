<script lang="ts">
    let picture: string | undefined;
    let title: string;
    let footer: boolean = false;
</script>


<div class="card" style="width: 18rem;">
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