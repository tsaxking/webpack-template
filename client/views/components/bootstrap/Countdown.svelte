<script lang="ts">
    import { onMount } from 'svelte';
    import { Loop } from '../../../../shared/loop';
    import { writable } from 'svelte/store';

    let w = writable([]);
    $w.length;

    export let targetTime: number;
    export let onFinish: () => void | undefined;

    let loop: Loop;

    let timeLeft: number;

    const updateCountdown = () => {
        const now = Date.now();
        const remaining = targetTime - now;
        timeLeft = Math.max(remaining, 0);

        if (remaining <= 0) {
            loop.stop();
            onFinish?.();
        }
    };

    onMount(() => {
        if (Date.now() > targetTime) {
            console.warn('Countdown target time is in the past');
            onFinish?.();
            return;
        }
        updateCountdown();
        loop = new Loop(updateCountdown, 1000);
        loop.start();

        return () => {
            loop.stop();
        };
    });
</script>

<div class="d-flex flex-column align-items-center">
    <!-- TODO: variable for this, pass in an element, or just do it yourself when you import this?
			<h4>Time Left:</h4>
			-->
    {#if timeLeft > 0}
        {#if timeLeft >= 3600000}
            <p class="display-4">
                {(timeLeft / 3600000) | 0}h {(timeLeft / 60000) % 60 | 0}m {(timeLeft /
                    1000) %
                    60 |
                    0}s
            </p>
        {:else if timeLeft >= 60000}
            <p class="display-4">
                {(timeLeft / 60000) | 0}m {(timeLeft / 1000) % 60 | 0}s
            </p>
        {:else}
            <p class="display-4">
                {(timeLeft / 1000) | 0}s
            </p>
        {/if}
    {:else}
        <p class="display-4">Now</p>
    {/if}
</div>

<style>
p.display-4 {
    font-size: 2rem;
    margin: 0;
}
</style>
