<script lang="ts">
import { onMount } from 'svelte';
import { DashboardCard } from '../../../models/cards';
import { Settings } from '../../../models/settings';
import { Keyboard } from '../../../utilities/keybinds';

export let title: string;
export let subtitle = '';
export let scroll = false;
export let id: string;

// let button: HTMLButtonElement;
export let expandable = false;
export let minimizable = false;
export let keyboard: Keyboard = Keyboard.default;

let expanded = false;

const toggleExpand = () => (expanded = !expanded);

$: {
    if (expanded) {
        keyboard.on('Escape', toggleExpand);
    } else {
        keyboard.off('Escape', toggleExpand);
    }
}

// TODO: Currently this will set settings every time the component is mounted. This is BAD
DashboardCard.add(id, title, {
    minimized: false
});
let minimized = DashboardCard.get(id)?.settings.minimized || false;

const toggleMinimize = () => {
    minimized = !minimized;
    DashboardCard.change(id, {
        minimized
    });
};

const onSettings = ([key, value]: [string, unknown]) => {
    if (key === 'dashboardCards') {
        minimized = DashboardCard.get(id)?.settings.minimized || false;
    }
};

Settings.on('set', onSettings);

onMount(() => {
    return () => {
        Settings.off('set', onSettings);
        keyboard.off('Escape', toggleExpand);
    };
});
</script>

{#if !minimized}
    <div class="col-xl-4 col-md-6 p-3">
        <div class="dashboard-card {expanded ? 'expanded' : ''}">
            <div class="card h-100 w-100">
                <div class="card-header">
                    <div class="d-flex justify-content-between">
                        {#if minimizable}
                            <button
                                class="btn m-0 p-0"
                                on:click="{toggleMinimize}"
                            >
                                <i class="material-icons">
                                    {minimized ? 'expand_more' : 'expand_less'}
                                </i>
                            </button>
                        {/if}
                        <div>
                            <h5 class="card-title">{title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">
                                {subtitle}
                            </h6>
                        </div>
                        {#if expandable}
                            <button
                                class="btn m-0 p-0"
                                on:click="{toggleExpand}"
                            >
                                <i class="material-icons">
                                    {expanded
                                        ? 'fullscreen_exit'
                                        : 'fullscreen'}
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
    </div>
{/if}

<style>
.dashboard-card {
    /* Force all cards to be the same height */
    height: 425px !important;
    transition:
        top 0.3s ease,
        left 0.3s ease,
        width 0.3s ease;
}

.dashboard-card.expanded {
    position: fixed;
    z-index: 2000;
    top: 50%;
    left: 50%;
    width: 100vw !important;
    height: 100vh !important;
    transform: translate(-50%, -50%);
    padding: 2em;
}
</style>
