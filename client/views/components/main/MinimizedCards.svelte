<script lang="ts">
    import { DashboardCard } from '../../../models/cards';
    import { Settings } from '../../../models/settings';

    export let cards: string[] = [];

    let minimizedCards = cards.filter(
        card => DashboardCard.get(card)?.settings.minimized || false
    );

    Settings.on('set', ([key, value]) => {
        if (key === 'dashboardCards') {
            minimizedCards = cards.filter(
                card => DashboardCard.get(card)?.settings.minimized || false
            );
        }
    });
</script>

{#if minimizedCards.length}
    <div class="dropdown">
        <button
            class="btn btn-primary position-relative dropdown-toggle"
            aria-expanded="false"
            data-bs-toggle="dropdown"
            type="button"
        >
            <i class="material-icons"> check_box_outline_blank </i>
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            >
                {minimizedCards.length}
                <span class="visually-hidden"> minimized cards </span>
            </span>
        </button>
        <ul class="dropdown-menu">
            {#each minimizedCards as card}
                <li>
                    <button
                        class="dropdown-item"
                        on:click="{() => {
                            DashboardCard.change(card, {
                                minimized: false
                            });
                        }}"
                    >
                        {card}
                    </button>
                </li>
            {/each}
        </ul>
    </div>
{/if}
