import { Cache } from "../cache";
import { TransactionType as TransactionTypeObj, Subtype as SubtypeObj } from "../../../shared/db-types-extended";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";

type TransactionTypeEvents = {
    'created': undefined;
    'updated': undefined;
}


export class TransactionType extends Cache<TransactionTypeEvents> {
    static readonly cache: Map<string, TransactionType> = new Map<string, TransactionType>();

    static async getTypes(): Promise<{
        types: TransactionType[];
        subtypes: Subtype[];
    }> {
        if (TransactionType.cache.size > 0 && Subtype.cache.size > 0) {
            return {
                types: Array.from(TransactionType.cache.values()),
                subtypes: Array.from(Subtype.cache.values())
            }
        }



        const { types, subtypes } = await ServerRequest.post<{
            types: TransactionTypeObj[];
            subtypes: SubtypeObj[];
        }>('/api/types/get-types');

        return {
            types: types.map(t => {
                if (!TransactionType.cache.has(t.id)) {
                    return new TransactionType(t);
                }
                return TransactionType.cache.get(t.id) as TransactionType;
            }),
            subtypes: subtypes.map(s => {
                if (!Subtype.cache.has(s.id)) {
                    return new Subtype(s);
                }
                return Subtype.cache.get(s.id) as Subtype;
            })
        }
    }

    static async newType(name: string) {
        return ServerRequest.post('/api/types/new-type', {
            name
        });
    }

    public readonly id: string;
    public name: string;
    public dateCreated: number;
    public dateModified: number;

    constructor(data: TransactionTypeObj) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.dateCreated = data.dateCreated;
        this.dateModified = data.dateModified;

        if (!TransactionType.cache.has(this.id)) {
            TransactionType.cache.set(this.id, this);
        }
    }



    async newSubtype(name: string, type: 'withdrawal' | 'deposit') {
        return ServerRequest.post('/api/types/new-subtype', {
            name,
            typeId: this.id,
            type
        });
    }

    async update(name: string) {
        return ServerRequest.post('/api/types/update', {
            id: this.id,
            name
        });
    }
};

socket.on('transaction-types:type-created', (data: TransactionTypeObj) => {
    if (!TransactionType.cache.has(data.id)) {
        const t = new TransactionType(data);
        t.$emitter.emit('created');
        TransactionType.emit('created', t);
    }
});
socket.on('transaction-types:type-updated', (data: TransactionTypeObj) => {
    if (TransactionType.cache.has(data.id)) {
        const t = TransactionType.cache.get(data.id) as TransactionType;
        Object.assign(t, data);
        t.$emitter.emit('updated');
        TransactionType.emit('updated', t);
    }
});



export class Subtype extends Cache<TransactionTypeEvents> {
    static readonly cache: Map<string, Subtype> = new Map<string, Subtype>();

    public readonly id: string;
    public name: string;
    public dateCreated: number;
    public dateModified: number;
    public typeId: string;
    public type: 'withdrawal' | 'deposit';

    constructor(data: SubtypeObj) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.dateCreated = data.dateCreated;
        this.dateModified = data.dateModified;
        this.typeId = data.typeId;
        this.type = data.type;

        if (!Subtype.cache.has(this.id)) {
            Subtype.cache.set(this.id, this);
        }
    }


    async update(name: string, type: 'withdrawal' | 'deposit') {
        return ServerRequest.post('/api/types/update-subtype', {
            id: this.id,
            name,
            type,
            typeId: this.typeId
        });
    };


    async swapType(typeId: string) {
        return ServerRequest.post('/api/types/update-subtype', {
            id: this.id,
            name: this.name,
            type: this.type,
            typeId
        });
    }
};


socket.on('transaction-types:subtype-created', (data: SubtypeObj) => {
    if (!Subtype.cache.has(data.id)) {
        const s = new Subtype(data);
        s.$emitter.emit('created');
        Subtype.emit('created', s);
    }
});




socket.on('transaction-types:subtype-updated', (data: SubtypeObj) => {
    if (Subtype.cache.has(data.id)) {
        const s = Subtype.cache.get(data.id) as Subtype;
        Object.assign(s, data);
        s.$emitter.emit('updated');
        Subtype.emit('updated', s);
    }
});