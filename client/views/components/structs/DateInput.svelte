<script lang="ts">
    export let data: string;
    export let header: string;
    export let onChange: (value: string) => void;
</script>

<input
    type="datetime-local"
    bind:value="{data}"
    on:change="{v => {
        onChange(new Date(v.currentTarget.value).toISOString());
    }}"
/>
