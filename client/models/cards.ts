import { Settings } from './settings';

type DashboardCardSettings = {
    minimized: boolean;
};

export class DashboardCard {
    public static readonly cards = new Map<string, DashboardCard>();
    public static add(
        id: string,
        title: string,
        settings: DashboardCardSettings
    ) {
        const card = new DashboardCard(id, title, settings);
        if (DashboardCard.cards.has(id)) return; // probably set through the settings
        DashboardCard.cards.set(id, card);
    }

    public static remove(id: string) {
        DashboardCard.cards.delete(id);
        const all = Array.from(DashboardCard.cards.entries());
        Settings.set('dashboardCards', all);
    }

    public static get(id: string) {
        return DashboardCard.cards.get(id);
    }

    public static change(id: string, settings: DashboardCardSettings) {
        const card = DashboardCard.get(id);
        if (!card) return;
        card.settings = settings;

        const all = Array.from(DashboardCard.cards.entries());
        Settings.set('dashboardCards', all);
    }

    constructor(
        public readonly id: string,
        public readonly name: string,
        public settings: DashboardCardSettings
    ) {}
}

Settings.on('set', ([key, value]) => {
    if (key === 'dashboardCards') {
        for (const [id, settings] of value as [
            string,
            DashboardCardSettings
        ][]) {
            const card = DashboardCard.get(id);
            if (card) card.settings = settings;
        }
    }
});
