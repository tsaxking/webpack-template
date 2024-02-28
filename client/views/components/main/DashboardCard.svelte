<script lang="ts">
export let title: string;
export let subtitle: string = '';
export let scroll: boolean = false;
</script>

<div class="col-xl-4 col-md-6 mb-3">
    <div class="card dashboard-card">
        <div class="card-header">
            <h5 class="card-title">{title}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{subtitle}</h6>
        </div>
        <div class="card-body {scroll ? 'scroll-y' : ''}">
            <slot />
        </div>
    </div>
</div>

<style>
.dashboard-card {
    /* Force all cards to be the same height */
    height: 400px !important;
}
</style>
