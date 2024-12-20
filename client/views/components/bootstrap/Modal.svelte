<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Random } from '../../../../shared/math';
    const dispatch = createEventDispatcher();
    export let title: string;
    export let message: string = '';
    export let id: string = 'modal-' + Random.uuid();
    export let show = false;

    export const close = () => {
        jQuery(`#${id}`).modal('hide');
    };

    export const open = () => {
        jQuery(`#${id}`).modal('show');
    };

    onMount(() => {
        if (show) {
            open();
        }

        jQuery(`#${id}`).on('hidden.bs.modal', () => {
            dispatch('hide');
            show = false;
        });

        jQuery(`#${id}`).on('shown.bs.modal', () => {
            dispatch('show');
            show = true;
        });

        document.querySelectorAll(`#${id} button.close-modal`).forEach(m => {
            close();
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
                <slot>
                    {#if message}
                        {message}
                    {/if}
                </slot>
            </div>
            <div class="modal-footer">
                <slot name="buttons">
                    <button
                        class="btn btn-secondary"
                        data-bs-dismiss="modal"
                        type="button"
                        on:click="{() => dispatch('close')}">Close</button
                    >
                </slot>
            </div>
        </div>
    </div>
</div>
