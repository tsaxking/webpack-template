<script lang="ts">
    import FilterBudget from "../components/transactions/FilterBudget.svelte";
    import { Transaction } from '../../models/transactions/transaction';
    import TransactionChart from "../components/transactions/TransactionChart.svelte";
    import NewTransaction from "../components/transactions/NewTransactionForm.svelte";
    import EditTransaction from "../components/transactions/EditTransaction.svelte";


    export let from: string;
    export let to: string;
    export let bucketId: string;
    export let search: string = '';

    export let transactions: Transaction[] = [];

    const transactionInfo = () => {
        return Promise.all(transactions.map(t => t.getTableData()));
    }

    let openedTransaction: Transaction;

    const openTransaction = (t: Transaction) => {
        openedTransaction = t;
    }

    const filter = () => {
        transactions = [];
        const em = Transaction.search(bucketId, new Date(from).getTime(), new Date(to).getTime());

        em.on('chunk', (t: Transaction) => {
            transactions = [...transactions, t];
        });
    }

    const onFilter = (e: CustomEvent) => {
        console.log(e.detail);

        transactions = [];
        const { search: s, from: f, to: t } = e.detail;

        search = s;
        from = new Date(s).toLocaleDateString().split('/').reverse().join('-');
        to = new Date(s).toLocaleDateString().split('/').reverse().join('-');

        filter();
    }

    Transaction.on('*', () => {
        transactions = [];
        filter();
    });
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <div class="col-12">
            <FilterBudget bind:active={bucketId} bind:from={from} bind:to={to} on:search={onFilter} on:changeBucket={({ detail }) => bucketId = detail}></FilterBudget>
        </div>
        <div class="col-12 p-2">
            <button type="button" class="btn btn-success w-100" data-bs-toggle="modal" data-bs-target="#new-transaction">
                <i class="material-icons">add_box</i>&nbsp;Transaction
            </button>
        </div>
    </div>
    
    <div class="row mb-3">
        <div class="col-lg-3 col-md-6 col-sm-12">
            <TransactionChart bind:from={from} bind:to={to} bind:bucketId={bucketId}/>
        </div>
    </div>

    <div class="row mb-3">
        <div class="table-responsive">
            <table class="table table-dark table-striped table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Subtype</th>
                        <th>Bucket</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {#await transactionInfo()}
                        <p>Loading...</p>
                    {:then tInfo}
                        {#each tInfo as t}
                            <tr on:click={() => {
                                openTransaction(t.transaction);
                            }}>
                                <td>{t.date}</td>
                                <td>{t.type}</td>
                                <td>{t.subtype}</td>
                                <td>{t.bucket}</td>
                                <td>{t.amount}</td>
                            </tr>
                        {/each}

                    {:catch error}
                        <p>Error loading transaction info</p>
                    {/await}
                </tbody>
            </table>
        </div>
    </div>
</div>



<EditTransaction id="edit-transaction" transaction={openedTransaction}/>
<NewTransaction id="new-transaction" />