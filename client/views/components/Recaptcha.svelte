<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    const d = createEventDispatcher();

    let div: HTMLDivElement;

    const onloadCallback = () => {
        d('loaded', div);
    };

    const onSuccess = (token: string) => {
        d('success', token);
    };

    const onExpire = () => {
        d('expired');
    };

    window.onloadCallback = onloadCallback;

    onMount(() => {
        document.addEventListener('DOMContentLoaded', e => {
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            return () => {
                document.head.removeChild(script);
            };
        });
    });
</script>

<div
    bind:this="{div}"
    class="g-recaptcha p-3"
    data-callback="onloadCallback"
    data-sitekey="{RECAPTCHA_SITE_KEY}"
/>
