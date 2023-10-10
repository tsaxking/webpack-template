import { Cache } from "../cache";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";
import { Bucket as BucketObj } from "../../../shared/db-types-extended";
import { Transaction } from "./transaction";
import { BalanceCorrection } from "./balance-correction";

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

        return ServerRequest.post<BucketObj[]>('/api/buckets/get-all')
            .then((buckets) => {
                return buckets.map((b) => new Bucket(b));
            });
    }

    static async getArchived(): Promise<Bucket[]> {
        if (Bucket.cache.size > 0) {
            return Array.from(Bucket.cache.values()).filter((b) => b.archived);
        }

        return ServerRequest.post<BucketObj[]>('/api/buckets/get-archived')
            .then((buckets) => {
                return buckets.map((b) => new Bucket(b));
            });
    }

    static async newBucket(data: {
    }) {
        return ServerRequest.post('/api/buckets/new', data);
    }

    public readonly id: string;
    public created: number;
    public name: string;
    public description: string;
    public archived: 0 | 1;
    public type: 'debit' | 'credit' | 'savings';

    constructor(data: BucketObj) {
        super();

        this.id = data.id;
        this.created = data.created;
        this.name = data.name;
        this.description = data.description;
        this.archived = data.archived;
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
        return new Promise<number>((res, rej) => {
            let balance = 0;
            const transactions = Transaction.search(this.id, 0, endDate);
    
            transactions.on('chunk', (t) => {
                switch (t.type) {
                    case 'withdrawal':
                        balance -= t.amount;
                        break;
                    case 'deposit':
                        balance += t.amount;
                        break;
                }
            });

            transactions.on('complete', async () => {
                const corrections = (await BalanceCorrection.fromBucket(this.id)).filter((c) => c.date <= endDate);
                balance += corrections.reduce((acc, c) => acc + c.balance, 0);

                res(balance);
            });
        });
    }

    async getBalanceGraphData(startDate: number, endDate: number): Promise<{ date: number, balance: number }[]> {
        let balance = await this.getBalanceAtDate(startDate);

        return new Promise<{ date: number, balance: number }[]>((res, rej) => {
        });
    }
};

socket.on('buckets:created', (data: BucketObj) => {
    new Bucket(data).$emitter.emit('created');
});

socket.on('buckets:updated', (data: BucketObj) => {
    const b = Bucket.cache.get(data.id);
    if (b) {
        Object.assign(b, data);
        Bucket.cache.set(data.id, b);

        b.$emitter.emit('updated');
    }
});

socket.on('buckets:archived', (id: string) => {
    const b = Bucket.cache.get(id);
    if (b) {
        b.archived = 1;
        Bucket.cache.set(id, b);

        b.$emitter.emit('archived');
    }
});

socket.on('buckets:restored', (id: string) => {
    const b = Bucket.cache.get(id);
    if (b) {
        b.archived = 0;
        Bucket.cache.set(id, b);

        b.$emitter.emit('restored');
    }
});
