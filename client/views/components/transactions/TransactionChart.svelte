<script lang="ts">
    import { random } from '../../../../shared/uuid';
    import Chart from 'chart.js/auto';
    import { Bucket } from '../../../models/transactions/bucket';
    import { Transaction } from '../../../models/transactions/transaction';

    export let from: string;
    export let to: string;
    export let bucketId: string;

    const b = Bucket.cache.get(bucketId);
    const id = 'chart-' + random();

    const generate = () => {
        if (b) {
            const canvas = document.querySelector('canvas#' + id) as HTMLCanvasElement;
            const ctx = canvas.getContext('2d');
            let chart: Chart;

            b.getBalanceGraphData(new Date(from).getTime(), new Date(to).getTime()).then(data => {
                if (chart) chart.destroy();
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(({date}) => {
                            const d = new Date(date);
                            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
                        }),
                        datasets: [{
                            label: 'Balance',
                            data: data.map(({balance}) => balance),
                            tension: 0.1,
                            fill: true
                        }, {
                            label: 'Transactions',
                            data: data.map(({ transactions }) => Transaction.value(transactions)),
                            tension: 0.5,
                            fill: false
                        }]
                    }
                });
            });
        }
    }

    generate();

    Bucket.on('update', generate);
    Transaction.on('update', generate);
    Transaction.on('create', generate);
    Transaction.on('delete', generate);
    Transaction.on('restore', generate);
    Transaction.on('archive', generate);
</script>

<canvas {id}></canvas>