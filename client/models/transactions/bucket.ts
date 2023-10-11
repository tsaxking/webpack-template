import { Cache } from "../cache";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";
import { Bucket as BucketObj } from "../../../shared/db-types-extended";
import { Transaction } from "./transaction";
import { BalanceCorrection } from "./balance-correction";
import { Subscription } from "./subscription";

type BucketEvents = {
    'created': undefined;
    'updated': undefined;
    'archived': undefined;
    'restored': undefined;
}

export class Bucket extends Cache<BucketEvents> {
    static readonly cache: Map<string, Bucket> = new Map<string, Bucket>();

    static async getAll(): Promise<Bucket[]> {
        if (Bucket.cache.size > 0) {
            return Array.from(Bucket.cache.values()).filter((b) => !b.archived);
        }

        return ServerRequest.post<BucketObj[]>('/api/buckets/all', null, {
            cached: true
        })
            .then((buckets) => {
                return buckets.map((b) => new Bucket(b));
            });
    }

    static async getArchived(): Promise<Bucket[]> {
        if (Bucket.cache.size > 0) {
            const res = Array.from(Bucket.cache.values()).filter((b) => b.archived);
            if (res.length) return res;
        }

        return ServerRequest.post<BucketObj[]>('/api/buckets/archived', null, {
            cached: true
        })
            .then((buckets) => {
                return buckets.map((b) => new Bucket(b));
            });
    }

    static async newBucket(data: {
        name: string;
        description: string;
        type: 'debit' | 'credit' | 'savings';
    }) {
        return ServerRequest.post('/api/buckets/new', data);
    }

    public readonly id: string;
    public created: number;
    public name: string;
    public description: string;
    public archived: boolean;
    public type: 'debit' | 'credit' | 'savings';

    constructor(data: BucketObj) {
        super();

        this.id = data.id;
        this.created = data.created;
        this.name = data.name;
        this.description = data.description;
        this.archived = !!data.archived;
        this.type = data.type;

        Bucket.cache.set(this.id, this);
    }

    async archive() {
        await ServerRequest.post('/api/buckets/set-archive-status', {
            id: this.id,
            archive: true
        });
    }

    async restore() {
        await ServerRequest.post('/api/buckets/set-archive-status', {
            id: this.id,
            archive: false
        });
    }

    async update(data: Partial<BucketObj>) {
        if (data.id) throw new Error('Cannot update id');
        return ServerRequest.post('/api/buckets/update', {
            ...this,
            ...data,
            id: this.id
        });
    }

    async getBalanceAtDate(endDate: number): Promise<number> {
        let balance = 0;

        const [
            transactions, 
            corrections,
            subscriptions
        ] = await Promise.all([
            Transaction.search(this.id, 0, endDate).promise,
            BalanceCorrection.fromBucket(this.id, 0, endDate),
            Subscription.fromBucket(this.id)
        ]);

        balance += Transaction.value(transactions);
        balance += BalanceCorrection.value(corrections);
        balance += Subscription.value(subscriptions, 0, endDate);

        return balance;
    }

    async getBalanceGraphData(startDate: number, endDate: number): Promise<{ date: number, balance: number, transactions: Transaction[] }[]> {
        let balance = await this.getBalanceAtDate(startDate);
        const transactions = await Transaction.search(this.id, startDate, endDate).promise;
        const corrections = await BalanceCorrection.fromBucket(this.id, startDate, endDate);

        return new Array<{ date: number, balance: number, transactions: Transaction[] }>(startDate - endDate + 1)
            .fill({ date: 0, balance: 0, transactions: [] })
            .map((_, i) => ({
                date: startDate + i,
                balance: (
                    balance + Transaction.value(transactions.filter((t) => t.date <= startDate + i))
                            + BalanceCorrection.value(corrections.filter((c) => c.date <= startDate + i))
                ),
                transactions: transactions.filter((t) => t.date <= startDate + i && t.date >= startDate + i - 86400000),
            }));
    }
};

socket.on('buckets:created', (data: BucketObj) => {
    const b = new Bucket(data);
    b.$emitter.emit('created');
    Bucket.emit('create', b);
});

socket.on('buckets:updated', (data: BucketObj) => {
    const b = Bucket.cache.get(data.id);
    if (b) {
        Object.assign(b, data);
        Bucket.cache.set(data.id, b);

        b.$emitter.emit('updated');
        Bucket.emit('update', b);
    }
});

socket.on('buckets:archived', (id: string) => {
    const b = Bucket.cache.get(id);
    if (b) {
        b.archived = true;
        Bucket.cache.set(id, b);

        b.$emitter.emit('archived');
        Bucket.emit('archive', b);
    }
});

socket.on('buckets:restored', (id: string) => {
    const b = Bucket.cache.get(id);
    if (b) {
        b.archived = false;
        Bucket.cache.set(id, b);

        b.$emitter.emit('restored');
        Bucket.emit('restore', b);
    }
});