import { Cache } from "../cache";
import { Transaction as TransactionObj } from "../../../shared/db-types-extended";
import { ServerRequest } from '../../utilities/requests';
import { socket } from '../../utilities/socket';
import { RetrieveStreamEventEmitter } from "../../utilities/requests";
import { Subtype, TransactionType } from "./types";
import { Bucket } from "./bucket";
import { notify } from "../../utilities/notifications";
import { formatDate } from "../../utilities/clock";


const formatter = formatDate('MM/DD/YYYY HH12:mm ap');


type TransactionEvents = {
    'updated': undefined;
    'archived': undefined;
    'restored': undefined;
    'created': undefined;
}





export class Transaction extends Cache<TransactionEvents> {
    static readonly cache: Map<string, Transaction> = new Map<string, Transaction>();
    static search(bucket: string, from: number, to: number, cached: boolean = false) {
        if (from > to) throw new Error('From date must be before to date');

        if (Transaction.cache.size > 0 && cached) {
            const items = Array.from(Transaction.cache.values());

            const filtered = items.filter(t => {
                return t.bucketId === bucket && +t.date >= from && +t.date <= to;
            });

            const em = new RetrieveStreamEventEmitter<Transaction>();

            const emit = (i: number) => em.emit('chunk', filtered[i]);

            const interval = setInterval(() => {
                if (filtered.length <= 0) {
                    clearInterval(interval);
                    return em.emit('complete', filtered);
                }

                emit(0);
                filtered.splice(0, 1);
            }, 5);

            return em;
        }


        const em = ServerRequest
            .retrieveStream<Transaction>('/api/transactions/search', {
                    bucket,
                    from: from.toString(),
                    to: to.toString()
                },
                (data) => new Transaction(JSON.parse(data))
            );

        return em;
    };

    static async taxDeductible(bucket: string, from: number, to: number) {
        const transactions = await Transaction.search(bucket, from, to).promise;
        return transactions.filter(t => t.taxDeductible);
    }

    static async archived(bucket: string, from: number, to: number) {
        const transactions = await Transaction.search(bucket, from, to).promise;
        return transactions.filter(t => t.archived);
    }

    static value(transactions: Transaction[]) {
        return transactions.reduce((acc, t) => {
            if (t.type === 'deposit') {
                return acc + t.amount;
            } else {
                return acc - t.amount;
            }
        }, 0);
    }

    static async newTransfer(data: {
        amount: number;
        date: string;
        fromBucketId: string;
        toBucketId: string;
        description: string;
        subtypeId: string;
        taxDeductible: boolean;
        status: 'pending' | 'completed' | 'failed';
    }) {
        return ServerRequest.post('/api/transactions/transfer', data);
    }

    static async newTransaction(data: {
        transfer?: string, // bucket id
        amount: number;
        type: 'withdrawal' | 'deposit';
        status: 'pending' | 'completed' | 'failed';
        date: string;
        bucketId: string;
        description: string;
        subtypeId: string;
        taxDeductible: boolean;
    }): Promise<boolean> {

        const fail = (needed: string) => {
            notify({
                message: 'Please fill in the ' + needed + ' field.',
                title: 'Invalid Input',
                color: 'danger',
                status: needed + ' is required.',
                code: 400,
                instructions: ''
            });
            return false;
        }

        if (!data.amount) return fail('amount');
        if (!data.date) return fail('date');
        if (!data.bucketId) return fail('bucket');
        // if (!data.description) return fail('description');
        if (!data.subtypeId) return fail('subtype');
        if (data.taxDeductible === undefined) return fail('tax deductible');
        if (!data.type) return fail('type');
        if (!data.status) return fail('status');


        if (data.transfer) {
            Transaction.newTransfer({
                amount: data.amount,
                date: data.date,
                fromBucketId: data.bucketId,
                toBucketId: data.transfer,
                description: data.description,
                subtypeId: data.subtypeId,
                taxDeductible: data.taxDeductible,
                status: data.status
            });
            return true;
        } else {
            ServerRequest.post('/api/transactions/new', data);
            return true;
        }
    }

    public readonly id: string;
    public amount: number;
    public type: 'withdrawal' | 'deposit';
    public status: 'pending' | 'completed' | 'failed';
    public date: string;
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

    async getTypeInfo(): Promise<{ type: TransactionType|null, subtype: Subtype|null }> {
        const { types, subtypes } = await TransactionType.getTypes();

        const subtype = subtypes.find(s => s.id === this.subtypeId);
        if (!subtype) return {
            type: null,
            subtype: null
        }
        const type = types.find(t => t.id === subtype.typeId);
        if (!type) return {
            type: null,
            subtype: subtype
        }

        return {
            type,
            subtype
        }
    }

    async getBucketName(): Promise<string|null> {
        const b = Bucket.cache.get(this.bucketId);
        if (!b) return null;
        return b.name;
    }

    async getTableData() {
        const typeInfo = await this.getTypeInfo();
        return {
            amount: this.amountString,
            type: typeInfo.type?.name ?? '',
            subtype: typeInfo.subtype?.name ?? '',
            bucket: await this.getBucketName(),
            date: formatter(new Date(+this.date)),
            transaction: this,
            id: this.id
        }
    }

    get amountString() {
        return this.amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }

    changePicture(pictures: FileList) {
        if (pictures.length > 1) throw new Error('Cannot upload more than one picture');

        ServerRequest.streamFiles('/api/transactions/change-picture', pictures, {
            id: this.id
        });
    }
};

socket.on('transactions:updated', (data: TransactionObj) => {
    const t = Transaction.cache.get(data.id);
    if (t) {
        Object.assign(t, data);
        Transaction.cache.set(data.id, t);

        t.$emitter.emit('updated');
        Transaction.emit('update', t);
    }
});

socket.on('transactions:archived', (id: string) => {
    const t = Transaction.cache.get(id);
    if (t) {
        t.archived = 1;
        Transaction.cache.set(id, t);

        t.$emitter.emit('archived');
        Transaction.emit('archive', t);
    }
});

socket.on('transactions:restored', (id: string) => {
    const t = Transaction.cache.get(id);
    if (t) {
        t.archived = 0;
        Transaction.cache.set(id, t);

        t.$emitter.emit('restored');
        Transaction.emit('restore', t);
    }
});

socket.on('transactions:created', (data: TransactionObj) => {
    const t = new Transaction(data);
    t.$emitter.emit('created');
    Transaction.emit('create', t);
});

socket.on('transactions:picture-updated', ({ id, picture }) => {
    const t = Transaction.cache.get(id);
    if (t) {
        t.picture = picture;
        Transaction.cache.set(id, t);

        t.$emitter.emit('updated');
        Transaction.emit('update', t);
    }
});