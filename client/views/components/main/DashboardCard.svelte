<script lang="ts">
import { onMount } from 'svelte';
import { Modal } from '../../../utilities/modals';

export let title: string;
export let subtitle: string = '';
export let scroll: boolean = false;

// let button: HTMLButtonElement;
</script>

<div class="col-xl-4 col-md-6 mb-3">
    <div class="card dashboard-card">
        <div class="card-header">
            <div class="d-flex justify-content-between">
                <span class="p-1">
                    <h5 class="card-title">{title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">{subtitle}</h6>
                </span>
                <!-- <button class="btn" bind:this={button}>
                        <i class="material-icons">open_in_full</i>
                    </button> -->
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
    height: 400px !important;
}
</style>
