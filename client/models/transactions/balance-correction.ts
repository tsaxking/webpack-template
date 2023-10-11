import { Cache } from "../cache";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";
import { BalanceCorrection as BalanceObj } from "../../../shared/db-types-extended";

type BalanceCorrectionEvents = {
    'created': undefined;
    'updated': undefined;
    'deleted': undefined;
};


export class BalanceCorrection extends Cache<BalanceCorrectionEvents> {
    static readonly cache: Map<string, BalanceCorrection> = new Map<string, BalanceCorrection>();

    static async getAll(): Promise<BalanceCorrection[]> {
        if (BalanceCorrection.cache.size > 0) {
            return Array.from(BalanceCorrection.cache.values())
        }

        return ServerRequest.post<BalanceObj[]>('/api/balance-corrections/all')
            .then((balances) => {
                return balances.map((b) => new BalanceCorrection(b));
            });
    }

    static async fromBucket(bucketId: string, from: number, to: number): Promise<BalanceCorrection[]> {
        return this.getAll().then((balances) => balances.filter(b => b.bucketId === bucketId && b.date >= from && b.date <= to));
    }

    static async newBalanceCorrection(data: {
        amount: number;
        date: number;
    }) {
        return ServerRequest.post('/api/balance-corrections/new', data);
    }

    static value(balances: BalanceCorrection[]): number {
        return balances.reduce((acc, b) => acc + b.balance, 0);
    }

    public readonly id: string;
    public date: number;
    public balance: number; // in cents
    public bucketId: string;

    constructor(data: BalanceObj) {
        super();

        this.id = data.id;
        this.date = data.date;
        this.balance = data.balance;
        this.bucketId = data.bucketId;

        BalanceCorrection.cache.set(this.id, this);
    }

    update(data: Partial<BalanceObj>){
        if (data.id) throw new Error('Cannot update id');

        return ServerRequest.post('/api/balance-corrections/update', {
            ...this,
            ...data,
            id: this.id
        });
    }

    delete() {
        return ServerRequest.post('/api/balance-corrections/delete', {
            id: this.id
        });
    }
};

socket.on('balance-correction:created', (data: BalanceObj) => {
    const c = new BalanceCorrection(data);
    c.$emitter.emit('created');
    BalanceCorrection.emit('create', c);
});

socket.on('balance-correction:deleted', (id: string) => {
    const b = BalanceCorrection.cache.get(id);
    if (!b) return;

    b.$emitter.emit('deleted');
    BalanceCorrection.emit('delete', b);
    b.destroy();
});

socket.on('balance-correction:updated', (data: BalanceObj) => {
    if (BalanceCorrection.cache.has(data.id)) {
        const b = BalanceCorrection.cache.get(data.id) as BalanceCorrection;
        Object.assign(b, data);
        b.$emitter.emit('updated');
        BalanceCorrection.emit('update', b);
    }
});