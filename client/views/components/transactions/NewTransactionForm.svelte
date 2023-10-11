<script lang="ts">
    import { TransactionType, Subtype } from "../../../models/transactions/types";
    import { Bucket } from "../../../models/transactions/bucket";
    import { Transaction } from "../../../models/transactions/transaction";
    import Modal from "../bootstrap/Modal.svelte";
    import { formatDate } from "../../../utilities/clock";

    const formatter = formatDate('YYYY-MM-DD');

    export let id: string;

    $: tempTransaction = {
        amount: 0,
        type: 'deposit',
        date: formatter(new Date()),
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

        // handles transfers
        const result = await Transaction.newTransaction({
            transfer: tempTransaction.type === 'transfer' ? tempTransaction.bucket2Id : undefined,
            amount: tempTransaction.amount,
            type: tempTransaction.type === 'transfer' ? 'withdrawal' : tempTransaction.type as 'deposit' | 'withdrawal',
            date: new Date(tempTransaction.date).getTime().toString(),
            description: tempTransaction.description,
            taxDeductible: tempTransaction.taxDeductible,
            bucketId: tempTransaction.bucket1Id,
            status: tempTransaction.status as 'completed' | 'pending' | 'failed',
            subtypeId: s.id
        });

        if (!result) return; // failed to create transaction due to incomplete fields

        // reset
        tempTransaction.amount = 0;
        tempTransaction.type = 'deposit';
        tempTransaction.status = 'completed';
        tempTransaction.date = formatter(new Date());
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
            <select name="type" id="type" class="form-control" bind:value={tempTransaction.typeInput} on:change={changeInput} required>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
            </select>


            <label for="type" class="input-group-text bg-{tempTransaction.typeInput === 'deposit' ? 'success' : 'danger'} text-light">{tempTransaction.typeInput === 'deposit' ? 'Into' : 'From'}</label>
            <select name="bucket" id="from-bucket" class="form-control" bind:value={tempTransaction.bucket1Id} required>
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
                <label for="to-bucket" class="input-group-text bg-success text-light">Into</label>
                <select name="bucket" class="form-control" id="to-bucket" bind:value={tempTransaction.bucket2Id}>
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
            
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</Modal>