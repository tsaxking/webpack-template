<script lang="ts">
    import BucketForm from "./BucketForm.svelte";
    import Modal from "../bootstrap/Modal.svelte";
    import { Bucket } from "../../../models/transactions/bucket";

    export let id: string;

    const newBucket = (e: CustomEvent) => {
        Bucket.newBucket(e.detail);
    }
</script>

<Modal {id} title="New Bucket">
    <BucketForm on:submit={newBucket}/>
</Modal>