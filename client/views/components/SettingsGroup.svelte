<script lang="ts">
import Setting from './Setting.svelte';
import type { SettingsType } from '../../models/settings';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();
export let settings: SettingsType[] = [];

const onChange = (setting: string, value: any) => {
    dispatch('change', { setting, value });
};
</script>

<div class="container-fluid">
    {#each settings as setting, i}
        <Setting
            {...setting}
            on:change="{({ detail }) => onChange(setting.name, detail)}"
        />
        {#if i !== settings.length - 1}
            <hr />
        {/if}
    {/each}
</div>
