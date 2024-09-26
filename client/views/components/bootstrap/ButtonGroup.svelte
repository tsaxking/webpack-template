<script lang="ts">
    export let size: 'sm' | 'lg' = 'sm';
    export let vertical: boolean = false;
</script>

<div
    class="btn-group btn-group-{size}"
    class:btn-group-vertical="{vertical}"
    aria-label="Basic example"
    role="group"
>
    <slot />
</div>
