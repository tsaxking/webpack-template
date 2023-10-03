<script lang="ts">
    export let show: boolean = false;
    export let title: string;
    const classes = 'modal fade';
</script>





<div class={show ? 'show ' + classes : classes} id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden={show ? 'false' : 'true'} aria-modal={show ? 'true' : 'false'} style={show ? 'display: block;' : 'display: none'}>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <slot></slot>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <slot name="buttons"></slot>
            </div>
        </div>
    </div>
</div>