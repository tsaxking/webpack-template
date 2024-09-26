<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    const dispatch = createEventDispatcher();
    export let title: string;
    export let message: string = '';
    export let id: string = 'modal-' + Math.random().toString(36);

    onMount(() => {
        jQuery(`#${id}`).on('hidden.bs.modal', () => {
            dispatch('hide');
        });

        jQuery(`#${id}`).on('shown.bs.modal', () => {
            dispatch('show');
        });

        document.querySelectorAll(`#${id} button.close-modal`).forEach(m => {
            jQuery(m).modal('hide');
        });
    });
</script>

<div
    {id}
    class="modal fade"
    aria-modal="true"
    role="dialog"
    tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{title}</h5>
                <button
                    class="btn-close close-modal"
                    aria-label="Close"
                    data-bs-dismiss="modal"
                    type="button"
                    on:click="{() => dispatch('hide')}"
                />
            </div>
            <div class="modal-body">
                {#if message}
                    {message}
                {/if}
                <slot />
            </div>
            <div class="modal-footer">
                <button
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                    type="button"
                    on:click="{() => dispatch('close')}">Close</button
                >
                <slot name="buttons" />
            </div>
        </div>
    </div>
</div>
