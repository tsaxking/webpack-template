<script lang="ts">
export let size: 'sm' | 'lg' = 'sm';
export let vertical: boolean = false;
</script>

<div
    class="btn-group btn-group-{size} {vertical ? 'btn-group-vertical' : ''}"
    role="group"
    aria-label="Basic example"
>
    <slot />
</div>
