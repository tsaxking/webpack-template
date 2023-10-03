<script lang="ts">
    export let color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' = 'primary';
    export let text: string;
    export let disabled: boolean = false;
    export let outline: boolean = false;
</script>


<button class="btn btn-{outline ? 'outline-' : ''}{color}" {disabled}>
    {text}
</button>