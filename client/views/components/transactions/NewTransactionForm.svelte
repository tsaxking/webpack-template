<script lang="ts">
    import { TransactionType, Subtype } from "../../../models/transactions/types";
    import { Bucket } from "../../../models/transactions/bucket";
    import { Transaction } from "../../../models/transactions/transaction";
    import Modal from "../bootstrap/Modal.svelte";
    export let id: string;

    let amount: number = 0;
    let type: 'deposit' | 'withdrawal' | 'transfer' = 'deposit';
    let status: 'completed' | 'pending' | 'failed' = 'completed';
    let date: string = new Date().toString();
    let description: string = '';
    let taxDeductible: boolean = false;
    let typeId: string = '';
    let bucket1Id: string = '';
    let bucket2Id: string = '';

    let typeName: string = '';
    let subtypeName: string = '';


    let setTypes: TransactionType[] = [];
    let setSubtypes: Subtype[] = [];

    const change = async () => {
        const { types, subtypes } = await TransactionType.getTypes();
        setTypes = types;

        setSubtypes = subtypes.filter(subtype => subtype.typeId === typeId && subtype.type === type);
    };

    change();


    const submit = async () => {
        const t = await TransactionType.newType(typeName);
        const s = await t.newSubtype(subtypeName, type === 'transfer' ? 'withdrawal' : type);

        if (type === 'transfer') {
            await Transaction.newTransfer({
                amount,
                status,
                date: new Date(date).getTime(),
                description,
                taxDeductible: taxDeductible ? 1 : 0,
                subtypeId: s.id,
                fromBucketId: bucket1Id,
                toBucketId: bucket2Id
            });
        } else {
            await Transaction.newTransaction({
                amount,
                status,
                date: new Date(date).getTime(),
                description,
                taxDeductible: taxDeductible ? 1 : 0,
                subtypeId: s.id,
                bucketId: bucket1Id,
                type
            });
        }

        // reset
        amount = 0;
        type = 'deposit';
        status = 'completed';
        date = new Date().toString();
        description = '';
        taxDeductible = false;
        typeId = '';
        bucket1Id = '';
        bucket2Id = '';

        typeName = '';
        subtypeName = '';

        change();
    };

    let typeInput: string;

    const changeInput = () => {
        if (typeInput === 'transfer') type = 'withdrawal';
        else type = typeInput as 'deposit' | 'withdrawal';
    }

    let buckets: Promise<Bucket[]> = Bucket.getAll();
</script>

<Modal {id} title="New Transaction">
    <form on:submit|preventDefault={submit}>
        <div class="input-group mb-3">
            <select name="type" id="type" bind:value={typeInput} on:change={changeInput}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
            </select>
            <label for="type" class="input-group">{type === 'withdrawal' ? 'From' : 'Into'}</label>
            <select name="bucket" id="from-bucket" bind:value={bucket1Id}>
                <option value="" disabled>Select Bucket</option>
                {#await buckets}
                    <option value="none" disabled>Loading...</option>
                {:then buckets} 
                    {#each buckets as bucket}
                        <option value={bucket.id}>{bucket.name}</option>
                    {/each}
                {/await}
            </select>
            {#if typeInput === 'transfer'}
                <label for="to-bucket" class="input-group">Into</label>
                <select name="bucket" id="bucket" bind:value={bucket2Id}>
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
                <input type="number" name="amount" id="amount" bind:value={amount} required>
                {#if type === 'withdrawal'}
                    <input type="checkbox" class="btn-check" id="tax-deductible" autocomplete="off" bind:checked={taxDeductible}>
                    <label class="btn btn-outline-primary" for="tax-deductible">Tax Deductible</label>
                {/if}
            </div>
        </div>

        <div class="mb-3">
            <label for="status" class="form-label">Status</label>
            <select name="status" id="status" required bind:value={status}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
            </select>
        </div>

        <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input type="date" name="date" id="date" required bind:value={date}>
        </div>

        
        <div class="mb-3">
            <label for="amount" class="form-label">Description</label>
            <textarea name="description" id="description" cols="30" rows="10" bind:value={description}></textarea>
        </div>

        <div class="mb-3">
            <label for="type" class="form-label">Transaction Type</label>
            <input type="text" name="transaction-type" id="transaction-type" list="transaction-types" bind:value={typeName} required on:input={change}>
            <datalist id="transaction-types">
                {#each setTypes as type}
                    <option value={type.name}>{type.name}</option>
                {/each}
            </datalist>

            <label for="subtype" class="form-label">Transaction Subtype</label>
            <input type="text" name="transaction-subtype" id="transaction-subtype" list="transaction-subtypes" bind:value={subtypeName} required on:input={change}>
            <datalist id="transaction-subtypes">
                {#each setSubtypes as subtype}
                    <option value={subtype.name}>{subtype.name}</option>
                {/each}
            </datalist>
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</Modal>