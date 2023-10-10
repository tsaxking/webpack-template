<script lang="ts">
    import FilterBudget from "../components/transactions/FilterBudget.svelte";
    import { Transaction } from '../../models/transactions/transaction';
    import TransactionChart from "../components/transactions/TransactionChart.svelte";
    import NewTransaction from "../components/transactions/NewTransaction.svelte";
    import EditTransaction from "../components/transactions/EditTransaction.svelte";


    export let from: number;
    export let to: number;
    export let bucketId: string;

    export let transactions: Transaction[] = [];

    const transactionInfo = () => {
        return Promise.all(transactions.map(t => t.getTableData()));
    }

    const openTransaction = (t: Transaction) => {}

    const onFilter = (e: CustomEvent) => {
        transactions = [];
        const { search, from, to } = e.detail;
        console.log(search, from, to);

        const em = Transaction.search(bucketId, from, to);

        em.on('chunk', (t: Transaction) => {
            transactions = [...transactions, t];
        });
    }
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <div class="col-12">
            <FilterBudget bind:activeBucket={bucketId} bind:from={from} bind:to={to} on:search={onFilter} on:changeBucket={({ detail }) => bucketId = detail}></FilterBudget>
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
                    {#each await transactionInfo() as t}
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
                </tbody>
            </table>
        </div>
    </div>
</div>



<EditTransaction />
<NewTransaction />