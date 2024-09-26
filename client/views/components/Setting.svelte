<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Settings, type SettingsType } from '../../models/settings';

    const dispatch = createEventDispatcher();
    type Types = 'range' | 'switch' | 'select';

    const ids = {
        select: 'select-' + Math.random().toString(36).substring(7),
        range: 'range-' + Math.random().toString(36).substring(7),
        switch: 'switch-' + Math.random().toString(36).substring(7)
    };

    export let name: SettingsType['name'] = '';
    export let type: SettingsType['type'] = 'switch';
    export let options: SettingsType['options'] = [];
    export let labelwidth = 3;
    export let inputWidth = 9;
    export let bindTo: string = '';
    export let value: unknown = undefined;

    onMount(() => {
        if (bindTo) {
            Settings.on('set', ([setting, v]) => {
                if (setting === bindTo) {
                    value = v;
                }
            });
        }
    });

    const init = (type: Types) => {
        switch (type) {
            case 'range':
                return 0;
            case 'switch':
                return false;
            case 'select':
                return '';
        }
    };

    $: {
        value = init(type);
    }

    const onChange = (v: unknown) => {
        value = v;
        dispatch('change', value);
        if (bindTo) {
            Settings.set(bindTo, value);
        }
    };
</script>

<div class="row m-3">
    {#if type === 'range'}
        <div class="col-{labelwidth} d-flex justify-content-center align-items-center"
        >
            <label
                class="form-label m-0"
                for="{ids.range}">
                {name}
                <slot />
                <!-- <span class="badge bg-secondary ms-2">{value !== undefined ? value : ''}</span> -->
            </label>
        </div>
        <div class="col-{inputWidth}">
            <input
                id="{ids.range}"
                class="form-range"
                max="{options[1] || 100}"
                min="{options[0] || 0}"
                type="range"
                bind:value
                on:change="{e => {
                    onChange(e.currentTarget.value);
                }}"
            />
        </div>
    {:else if type === 'switch'}
        <div class="col-{labelwidth} d-flex justify-content-center align-items-center"
        >
            <label
                class="form-check-label m-0"
                for="{ids.switch}">{name}</label
            >
            <slot />
            <!-- <span class="badge bg-secondary ms-2">{value !== undefined ? value : ''}</span> -->
        </div>
        <div class="col-{inputWidth}">
            <div class="form-check form-switch">
                <input
                    id="{ids.switch}"
                    class="form-check-input"
                    role="switch"
                    type="checkbox"
                    bind:checked="{value}"
                    on:change="{e => {
                        onChange(e.currentTarget.checked);
                    }}"
                />
            </div>
        </div>
    {:else if type === 'select'}
        <div class="col-{labelwidth} d-flex justify-content-center align-items-center"
        >
            <slot />
            <label
                class="form-label m-0"
                for="{ids.select}">{name}</label>
            <!-- <span class="badge bg-secondary ms-2">{value !== undefined ? value : ''}</span> -->
        </div>
        <div class="col-{inputWidth}">
            <select
                id="{ids.select}"
                class="form-select"
                bind:value
                on:change="{e => {
                    onChange(e.currentTarget.value);
                }}"
            >
                {#each options as option}
                    <option value="{option}">{option}</option>
                {/each}
            </select>
        </div>
    {/if}
</div>
