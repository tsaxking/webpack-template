<script lang="ts">
export let title: string;
export let subtitle: string = '';
export let scroll: boolean = false;

// let button: HTMLButtonElement;
export let expandable: boolean = false;

let expanded = false;
</script>

<div class="col-xl-4 col-md-6 mb-3">
    <div class="card dashboard-card {expanded ? 'expanded' : ''}">
        <div class="card-header">
            <div class="d-flex justify-content-between">
                <div>
                    <h5 class="card-title">{title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">{subtitle}</h6>
                </div>
                {#if expandable}
                    <button
                        class="btn m-0 p-0"
                        on:click="{() => (expanded = !expanded)}"
                    >
                        <i class="material-icons">
                            {expanded ? 'fullscreen_exit' : 'fullscreen'}
                        </i>
                    </button>
                {/if}
            </div>
        </div>
        <div class="card-body {scroll ? 'scroll-y' : ''} no-scroll-x">
            <slot />
        </div>
    </div>
</div>

<style>
.dashboard-card {
    /* Force all cards to be the same height */
    height: 425px !important;
    transition:
        top 0.3s ease,
        left 0.3s ease,
        width 0.3s ease,
        height 0.3s ease;
}

.dashboard-card.expanded {
    position: fixed;
    z-index: 2000;
    top: calc(50% + 10vh);
    left: 50%;
    width: 100vw !important;
    height: 90vh !important;
    transform: translate(-50%, -50%);
    /* animate */
}
</style>
