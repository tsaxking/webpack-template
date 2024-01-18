<script lang="ts">
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();
export let title: string;
export let message: string = '';
export let id: string = 'modal-' + Math.random().toString(36);
</script>

<div class="modal fade" tabindex="-1" aria-modal="true" role="dialog" {id}>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{title}</h5>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    on:click="{() => dispatch('close')}"
                ></button>
            </div>
            <div class="modal-body">
                {#if message}
                    {message}
                {/if}
                <slot />
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                    on:click="{() => dispatch('close')}">Close</button
                >
                <slot name="buttons" />
            </div>
        </div>
    </div>
</div>
