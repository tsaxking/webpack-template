<script lang="ts">
import SettingsGroup from '../components/SettingsGroup.svelte';
import { Settings, type SettingsType } from '../../models/settings';

const settings: SettingsType[] = [
    {
        name: 'Theme',
        type: 'select',
        options: ['Light', 'Dark'],
        bindTo: 'theme',
        value: 'Light'
    }
];

const onChange = ({ detail }) => {
    // console.log(detail);
};

Settings.on('change', ([s, v]) => {
    switch (s) {
        case 'theme':
            (() => {
                const html = document.querySelector('html');
                if (html) {
                    html.dataset.bsTheme = String(v).toLowerCase();
                }
            })();
            break;
    }
});
</script>

<SettingsGroup {settings} on:change="{onChange}" />
