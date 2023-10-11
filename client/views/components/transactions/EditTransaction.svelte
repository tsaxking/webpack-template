<script lang="ts">
    import Modal from "../bootstrap/Modal.svelte";
    import { Transaction } from "../../../models/transactions/transaction";
    import { Bucket } from "../../../models/transactions/bucket";
    import { TransactionType, Subtype } from "../../../models/transactions/types";
    import { formatDate } from "../../../utilities/clock";

    const formatter = formatDate('YYYY-MM-DD');

    export let id: string;
    export let transaction: Transaction|undefined;

    $: tempTransaction = {
        amount: transaction?.amount,
        type: transaction?.type,
        date: formatter(new Date(transaction?.date)),
        description: transaction?.description,
        taxDeductible: !!transaction?.taxDeductible,
        bucketId: transaction?.bucketId,
        archived: !!transaction?.archived,
        status: transaction?.status
    };


    
    let setTypes: TransactionType[] = [];
    let setSubtypes: Subtype[] = [];
    let typeId: string = '';
    let typeName: string = '';
    let subtypeName: string = '';

    const change = async () => {
        const { types, subtypes } = await TransactionType.getTypes();
        setTypes = types;

        setSubtypes = subtypes.filter(subtype => subtype.typeId === typeId && subtype.type === tempTransaction.type);
    };

    change();

    

    // const fail = (needed: string) => notify({
    //     message: 'Please fill in the ' + needed + ' field.',
    //     title: 'Invalid Input',
    //     color: 'danger',
    //     status: needed + ' is required.',
    //     code: 400,
    //     instructions: ''
    // });

    
    const submit = async () => {
        const t = await TransactionType.newType(typeName);
        const s = await t.newSubtype(subtypeName, tempTransaction.type);

        // if (!tempTransaction.amount) return fail('amount');
        // if (!typeId) return fail('type');
        // if (!tempTransaction.bucketId) return fail('bucket');
        // if (!tempTransaction.status) return fail('status');
        // if (!tempTransaction.date) return fail('date');
        // if (!tempTransaction.description) return fail('description');

        return transaction.update({
            amount: tempTransaction.amount,
            status: tempTransaction.status,
            date: new Date(tempTransaction.date).getTime().toString(),
            description: tempTransaction.description,
            taxDeductible: tempTransaction.taxDeductible ? 1 : 0,
            subtypeId: s.id,
            bucketId: tempTransaction.bucketId
        });
    };

    const buckets: Promise<Bucket[]> = Bucket.getAll();
</script>

<Modal {id} title="Edit Transaction">
    <form on:submit|preventDefault={submit}>
        <div class="input-group mb-3">
            <input type="checkbox" class="btn-check" id="archived" autocomplete="off" bind:checked={tempTransaction.archived}>
            <label class="btn btn-outline-danger" for="archived">Archived</label>
            <select name="type" id="type" bind:value={tempTransaction.type}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
            </select>
            <label for="type" class="input-group">{tempTransaction.type === 'withdrawal' ? 'From' : 'Into'}</label>
            <select name="bucket" id="from-bucket" bind:value={tempTransaction.bucketId}>
                <option value="" disabled>Select Bucket</option>
                {#await buckets}
                    <option value="none" disabled>Loading...</option>
                {:then buckets} 
                    {#each buckets as bucket}
                        <option value={bucket.id}>{bucket.name}</option>
                    {/each}
                {/await}
            </select>
        </div>

        <div class="mb-3">
            <label for="amount" class="form-label">Amount</label>
            <div class="input-group">
                <span class="input-group-text">₱</span>
                <input type="number" name="amount" id="amount" bind:value={tempTransaction.amount} required>
                {#if tempTransaction.type === 'withdrawal'}
                    <input type="checkbox" class="btn-check" id="tax-deductible" autocomplete="off" bind:checked={tempTransaction.taxDeductible}>
                    <label class="btn btn-outline-primary" for="tax-deductible">Tax Deductible</label>
                {/if}
            </div>
        </div>

        <div class="mb-3">
            <label for="status" class="form-label">Status</label>
            <select name="status" id="status" required bind:value={tempTransaction.status}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
            </select>
        </div>

        <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input type="date" name="date" id="date" required bind:value={tempTransaction.date}>
        </div>

        
        <div class="mb-3">
            <label for="amount" class="form-label">Description</label>
            <textarea name="description" id="description" cols="30" rows="10" bind:value={tempTransaction.description}></textarea>
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

        <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">Submit</button>
    </form>
</Modal>