import { Cache } from "../cache";
import { Miles as MilesObj } from "../../../shared/db-types-extended";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";


type MilesEvents = {
    'created': undefined;
    'updated': undefined;
    'archived': undefined;
    'restored': undefined;
};


export class Miles extends Cache<MilesEvents> {
    static readonly cache: Map<string, Miles> = new Map<string, Miles>();

    static async getActive(): Promise<Miles[]> {
        if (Miles.cache.size > 0) {
            return Array.from(Miles.cache.values()).filter((m) => !m.archived);
        }

        return ServerRequest.post<MilesObj[]>('/api/miles/active', null, {
            cached: true
        })
            .then((miles) => {
                return miles.map((m) => new Miles(m));
            });
    }

    static async getArchived(): Promise<Miles[]> {
        if (Miles.cache.size > 0) {
            const res = Array.from(Miles.cache.values()).filter((m) => m.archived);
            if (res.length) return res;
        }

        return ServerRequest.post<MilesObj[]>('/api/miles/archived', null, {
            cached: true
        })
            .then((miles) => {
                return miles.map((m) => new Miles(m));
            });
    }

    static async newMiles(data: {
        amount: number;
        date: number;
    }) {
        return ServerRequest.post('/api/miles/new', data);
    }

    public readonly id: string;
    public amount: number;
    public date: number;
    public archived: 0 | 1;

    constructor(data: MilesObj) {
        super();

        this.id = data.id;
        this.amount = data.amount;
        this.date = data.date;
        this.archived = data.archived;

        Miles.cache.set(this.id, this);
    }

    update(data: Partial<MilesObj>) {
        if (data.id) throw new Error('Cannot update id');

        ServerRequest.post('/api/miles/miles-update', {
            ...this,
            ...data,
            id: this.id
        });
    }

    archive() {
        if (this.archived) return;
        return ServerRequest.post('/api/miles/set-archive', {
            id: this.id,
            archive: true
        });
    }

    restore() {
        if (!this.archived) return;
        return ServerRequest.post('/api/miles/set-archive', {
            id: this.id,
            archive: false
        });
    }
};

socket.on('miles:archived', (id: string) => {
    const m = Miles.cache.get(id);
    if (m) {
        m.archived = 1;
        m.$emitter.emit('archived');
        Miles.emit('archive', m);
    }
});

socket.on('miles:restored', (id: string) => {
    const m = Miles.cache.get(id);
    if (m) {
        m.archived = 0;
        m.$emitter.emit('restored');
        Miles.emit('restore', m);
    }
});

socket.on('miles:created', (data: MilesObj) => {
    if (!Miles.cache.has(data.id)) {
        const m = new Miles(data);
        m.$emitter.emit('created');
        Miles.emit('create', m);
    }
});

socket.on('miles:updated', (data: MilesObj) => {
    if (Miles.cache.has(data.id)) {
        const m = Miles.cache.get(data.id) as Miles;
        Object.assign(m, data);
        m.$emitter.emit('updated');
        Miles.emit('update', m);
    }
});