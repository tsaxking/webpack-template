<script lang="ts">
    import { TransactionType, Subtype } from "../../../models/transactions/types";
    import { Bucket } from "../../../models/transactions/bucket";
    import { Transaction } from "../../../models/transactions/transaction";
    import Modal from "../bootstrap/Modal.svelte";
    export let id: string;

    $: tempTransaction = {
        amount: 0,
        type: 'deposit',
        date: new Date().toLocaleDateString().split('/').reverse().join('-'),
        description: '',
        taxDeductible: false,
        bucket1Id: '',
        bucket2Id: '',
        archived: false,
        status: 'completed',
        typeId: '',
        typeInput: ''
    }

    $: typeInfo = {
        typeName: '',
        subtypeName: ''
    };


    let setTypes: TransactionType[] = [];
    let setSubtypes: Subtype[] = [];

    const change = async () => {
        const { types, subtypes } = await TransactionType.getTypes();
        setTypes = types;

        setSubtypes = subtypes.filter(subtype => subtype.typeId === tempTransaction.typeId && subtype.type === tempTransaction.type);
    };

    change();


    const submit = async () => {
        const t = await TransactionType.newType(typeInfo.typeName);
        const s = await t.newSubtype(typeInfo.subtypeName, tempTransaction.type === 'transfer' ? 'withdrawal' : tempTransaction.type as 'deposit' | 'withdrawal');

        if (tempTransaction.type === 'transfer') {
            await Transaction.newTransfer({
                amount: tempTransaction.amount,
                status: tempTransaction.status === 'completed' ? 'completed' : 'pending',
                date: new Date(tempTransaction.date).getTime(),
                description: tempTransaction.description,
                taxDeductible: tempTransaction.taxDeductible ? 1 : 0,
                subtypeId: s.id,
                fromBucketId: tempTransaction.bucket1Id,
                toBucketId: tempTransaction.bucket2Id
            });
        } else {
            await Transaction.newTransaction({
                amount: tempTransaction.amount,
                status: tempTransaction.status === 'completed' ? 'completed' : 'pending',
                date: new Date(tempTransaction.date).getTime(),
                description: tempTransaction.description,
                taxDeductible: tempTransaction.taxDeductible ? 1 : 0,
                subtypeId: s.id,
                bucketId: tempTransaction.bucket1Id,
                type: tempTransaction.type as 'deposit' | 'withdrawal'
            });
        }

        // reset
        tempTransaction.amount = 0;
        tempTransaction.type = 'deposit';
        tempTransaction.status = 'completed';
        tempTransaction.date = new Date().toString();
        tempTransaction.description = '';
        tempTransaction.taxDeductible = false;
        tempTransaction.typeId = '';
        tempTransaction.bucket1Id = '';
        tempTransaction.bucket2Id = '';

        typeInfo.typeName = '';
        typeInfo.subtypeName = '';

        change();
    };

    const changeInput = () => {
        if (tempTransaction.typeInput === 'transfer') tempTransaction.type = 'withdrawal';
        else tempTransaction.type = tempTransaction.typeInput as 'deposit' | 'withdrawal';
    }

    let buckets: Promise<Bucket[]> = Bucket.getAll();
</script>

<Modal {id} title="New Transaction">
    <form on:submit|preventDefault={submit}>
        <div class="input-group mb-3">
            <select name="type" id="type" class="form-select" bind:value={tempTransaction.typeInput} on:change={changeInput}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
            </select>
            <label for="type" class="input-group">{tempTransaction.type === 'withdrawal' ? 'From' : 'Into'}</label>
            <select name="bucket" id="from-bucket" class="form-select" bind:value={tempTransaction.bucket1Id}>
                <option value="" disabled>Select Bucket</option>
                {#await buckets}
                    <option value="none" disabled>Loading...</option>
                {:then buckets} 
                    {#each buckets as bucket}
                        <option value={bucket.id}>{bucket.name}</option>
                    {/each}
                {/await}
            </select>
            {#if tempTransaction.typeInput === 'transfer'}
                <label for="to-bucket" class="input-group">Into</label>
                <select name="bucket" class="form-select" id="to-bucket" bind:value={tempTransaction.bucket2Id}>
                    <option value="" disabled>Select Bucket</option>
                    {#await buckets}
                        <option value="none" disabled>Loading...</option>
                    {:then buckets} 
                        {#each buckets as bucket}
                            <option value={bucket.id}>{bucket.name}</option>
                        {/each}
                    {/await}
                </select>
            {/if}
        </div>

        <div class="mb-3">
            <label for="amount" class="form-label">Amount</label>
            <div class="input-group">
                <span class="input-group-text">₱</span>
                <input type="number" class="form-control" name="amount" id="amount" bind:value={tempTransaction.amount} required>
                {#if tempTransaction.type === 'withdrawal'}
                    <input type="checkbox" class="btn-check" id="tax-deductible" autocomplete="off" bind:checked={tempTransaction.taxDeductible}>
                    <label class="btn btn-outline-primary" for="tax-deductible">Tax Deductible</label>
                {/if}
            </div>
        </div>

        <div class="mb-3">
            <label for="status" class="form-label">Status</label>
            <select name="status" class="form-select" id="status" required bind:value={tempTransaction.status}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
            </select>
        </div>

        <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input type="date" class="form-control" name="date" id="date" required bind:value={tempTransaction.date}>
        </div>

        
        <div class="mb-3">
            <label for="amount" class="form-label">Description</label>
            <textarea name="description" class="form-control" id="description" cols="30" rows="10" bind:value={tempTransaction.description}></textarea>
        </div>

        <div class="mb-3">
            <label for="type" class="form-label">Transaction Type</label>
            <input type="text" class="form-control" name="transaction-type" id="transaction-type" list="transaction-types" bind:value={typeInfo.typeName} required on:input={change}>
            <datalist id="transaction-types">
                {#each setTypes as type}
                    <option value={type.name}>{type.name}</option>
                {/each}
            </datalist>

            <label for="subtype" class="form-label">Transaction Subtype</label>
            <input type="text" class="form-control" name="transaction-subtype" id="transaction-subtype" list="transaction-subtypes" bind:value={typeInfo.subtypeName} required on:input={change}>
            <datalist id="transaction-subtypes">
                {#each setSubtypes as subtype}
                    <option value={subtype.name}>{subtype.name}</option>
                {/each}
            </datalist>
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</Modal>