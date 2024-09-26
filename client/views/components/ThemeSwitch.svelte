<script lang="ts">
    import Setting from './Setting.svelte';
    import { Settings } from '../../models/settings';
    import { onMount } from 'svelte';

    let theme: 'Light' | 'Dark' = Settings.get('theme') || 'Light';

    let el: HTMLDivElement;

    const change = (value: 'Light' | 'Dark') => {
        if (value === theme) return;
        el.classList.add(
            'animate__animated',
            'animate__rotateOut',
            'animate__faster'
        );
        setTimeout(() => {
            theme = value;
            el.classList.remove('animate__animated', 'animate__rotateOut');
            el.classList.add('animate__animated', 'animate__rotateIn');
            setTimeout(() => {
                el.classList.remove('animate__animated', 'animate__rotateIn');
            }, 500);
        }, 500);
    };

    onMount(() => {
        Settings.on('set', ([k, v]) => {
            if (k === 'theme') {
                change(v as 'Light' | 'Dark');
            }
        });
    });

    $: {
        document.documentElement.setAttribute('data-bs-theme', theme.toLowerCase());
    }
</script>

<Setting
    type="switch"
    value="{theme === 'Dark'}"
    on:change="{({ detail }) => {
        Settings.set('theme', detail ? 'Dark' : 'Light');
        change(detail ? 'Dark' : 'Light');
    }}"
>
    <div bind:this="{el}">
        {#if theme === 'Light'}
            <span class="material-icons">light_mode</span>
        {:else}
            <span class="material-icons">dark_mode</span>
        {/if}
    </div>
</Setting>
