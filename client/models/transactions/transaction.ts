import { Cache } from "../cache";
import { Transaction as TransactionObj } from "../../../shared/db-types-extended";
import { ServerRequest } from '../../utilities/requests';
import { socket } from '../../utilities/socket';
import { RetrieveStreamEventEmitter } from "../../utilities/requests";




type TransactionEvents = {
    'update': undefined;
    'archived': undefined;
    'restored': undefined;
    'created': undefined;
}





export class Transaction extends Cache<TransactionEvents> {
    static readonly cache: Map<string, Transaction> = new Map<string, Transaction>();
    static search(bucket: string, from: number, to: number) {
        if (from > to) throw new Error('From date must be before to date');

        if (Transaction.cache.size > 0) {
            const items = Array.from(Transaction.cache.values()).filter((t) => t.bucketId === bucket && t.date >= from && t.date <= to);

            const em = new RetrieveStreamEventEmitter<Transaction>();

            items.forEach(t => em.emit('chunk', t));
            em.emit('complete', items);

            return em;
        }


        const em = ServerRequest
            .retrieveStream<Transaction>('/api/transactions/search', {
                    bucket,
                    from,
                    to
                },
                (data) => new Transaction(JSON.parse(data))
            );

        return em;
    };

    public readonly id: string;
    public amount: number;
    public type: 'withdrawal' | 'deposit';
    public status: 'pending' | 'completed' | 'failed';
    public date: number;
    public bucketId: string;
    public description: string;
    public subtypeId: string;
    public taxDeductible: 0 | 1;
    public archived: 0 | 1;
    public picture: string|null;

    constructor(obj: TransactionObj) {
        super();
        this.id = obj.id;
        this.amount = obj.amount;
        this.type = obj.type;
        this.status = obj.status;
        this.date = obj.date;
        this.bucketId = obj.bucketId;
        this.description = obj.description;
        this.subtypeId = obj.subtypeId;
        this.taxDeductible = obj.taxDeductible;
        this.archived = obj.archived;
        this.picture = obj.picture;

        if (!Transaction.cache.has(this.id)) {
            Transaction.cache.set(this.id, this);
        }
    };

    update(data: Partial<TransactionObj>) {
        if (data.id) {
            throw new Error('Cannot update ID');
        }
        return ServerRequest.post('/api/transactions/update', {
            ...this,
            ...data,
            id: this.id
        });
    }

    archive() {
        if (this.archived) return;
        return ServerRequest.post('/api/transactions/change-transaction-archive-status', {
            id: this.id,
            archive: true
        });
    }

    restore() {
        if (!this.archived) return;
        return ServerRequest.post('/api/transactions/change-transaction-archive-status', {
            id: this.id,
            archive: false
        });
    }
};

socket.on('transactions:updated', (data: TransactionObj) => {
    const t = Transaction.cache.get(data.id);
    if (t) {
        Object.assign(t, data);
        Transaction.cache.set(data.id, t);

        t.$emitter.emit('update');
    }
});

socket.on('transactions:archived', (id: string) => {
    const t = Transaction.cache.get(id);
    if (t) {
        t.archived = 1;
        Transaction.cache.set(id, t);

        t.$emitter.emit('archived');
    }
});

socket.on('transactions:restored', (id: string) => {
    const t = Transaction.cache.get(id);
    if (t) {
        t.archived = 0;
        Transaction.cache.set(id, t);

        t.$emitter.emit('restored');
    }
});

socket.on('transactions:created', (data: TransactionObj) => {
    const t = new Transaction(data);
    t.$emitter.emit('created');
});