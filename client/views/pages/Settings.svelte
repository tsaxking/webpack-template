<script lang="ts">
import SettingsGroup from '../components/SettingsGroup.svelte';
import { Settings, type SettingsType } from '../../models/settings';

export let settings: SettingsType[] = [
    {
        name: 'Theme',
        type: 'select',
        options: ['Light', 'Dark'],
        bindTo: 'theme',
        value: 'Light'
    }
];
</script>

<SettingsGroup {settings} />

<!-- TODO: Change account information -->
