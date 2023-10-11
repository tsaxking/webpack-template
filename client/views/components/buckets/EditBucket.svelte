<script lang="ts">
    import BucketForm from "./BucketForm.svelte";
    import Modal from "../bootstrap/Modal.svelte";
    import { Bucket } from "../../../models/transactions/bucket";


    export let bucket: Bucket|undefined;

    const editBucket = (e: CustomEvent) => {
        bucket.update(e.detail);
    }

    export let id: string;
</script>

<Modal {id} title="Edit Bucket">
    <BucketForm name={bucket?.name} description={bucket?.description} type={bucket?.type} on:submit={editBucket}/>
</Modal>