import { Cache } from "../cache";
import { Subscription as SubscriptionObj } from "../../../shared/db-types-extended";
import { ServerRequest } from "../../utilities/requests";
import { socket } from "../../utilities/socket";


type SubscriptionEvents = {
    'archived': undefined;
    'restored': undefined;
    'created': undefined;
    'updated': undefined;
};

export class Subscription extends Cache<SubscriptionEvents> {
    static readonly cache: Map<string, Subscription> = new Map<string, Subscription>();

    static async getAll(): Promise<Subscription[]> {
        if (Subscription.cache.size > 0) {
            return Array.from(Subscription.cache.values()).filter((s) => !s.archived);
        }

        return ServerRequest.post<SubscriptionObj[]>('/api/subscriptions/get-all', null, {
            cached: true
        })
            .then((subs) => {
                return subs.map((s) => new Subscription(s));
            });
    }

    static async getArchived(): Promise<Subscription[]> {
        if (Subscription.cache.size > 0) {
            const res = Array.from(Subscription.cache.values()).filter((s) => s.archived);
            if (res.length) return res;
        }

        return ServerRequest.post<SubscriptionObj[]>('/api/subscriptions/get-archived', null, {
            cached: true
        })
            .then((subs) => {
                return subs.map((s) =>  new Subscription(s));
            });
    }

    static newSubscription(data: {
        name: string;
        startDate: number;
        endDate: number|null;
        interval: number; // in ms
        bucketId: string;
        amount: number; // in cents
        subtypeId: string;
        description: string;
        picture: string|null;
        taxDeductible: 0 | 1;
    }) {
        return ServerRequest.post('/api/subscriptions/new', data);
    }

    static async fromBucket(bucketId: string): Promise<Subscription[]> {
        const subs = await this.getAll();
        return subs.filter(s => s.bucketId === bucketId);
    }

    static value(subs: Subscription[], from: number, to: number) {
        return subs.reduce((acc, s) => {
            if (s.startDate > to || (s.endDate && s.endDate < from)) return acc;
            return acc + s.amount;
        }, 0);
    };

    public readonly id: string;
    public name: string;
    public startDate: number;
    public endDate: number|null;
    public interval: number; // in ms
    public bucketId: string;
    public amount: number; // in cents
    public subtypeId: string;
    public description: string;
    public picture: string|null;
    public taxDeductible: 0 | 1;
    public archived: 0 | 1;

    constructor(data: SubscriptionObj) {
        super();

        this.id = data.id;
        this.name = data.name;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.interval = data.interval;
        this.bucketId = data.bucketId;
        this.amount = data.amount;
        this.subtypeId = data.subtypeId;
        this.description = data.description;
        this.picture = data.picture;
        this.taxDeductible = data.taxDeductible;
        this.archived = data.archived;

        if (!Subscription.cache.has(this.id)) {
            Subscription.cache.set(this.id, this);
        }
    }

    update(data: Partial<SubscriptionObj>) {
        if (data.id) {
            throw new Error('Cannot update ID');
        }
        return ServerRequest.post('/api/subscriptions/update', {
            ...this,
            ...data,
            id: this.id
        });
    }

    archive() {
        if (this.archived) return;
        return ServerRequest.post('/api/subscriptions/set-archive', {
            id: this.id,
            archive: true
        });
    }

    restore() {
        if (!this.archived) return;
        return ServerRequest.post('/api/subscriptions/set-archive', {
            id: this.id,
            archive: false
        });
    }

    
};


socket.on('subscriptions:archived', (id: string) => {
    const s = Subscription.cache.get(id);
    if (s) {
        s.archived = 1;
        s.$emitter.emit('archived');
        Subscription.emit('archive', s);
    }
});

socket.on('subscriptions:restored', (id: string) => {
    const s = Subscription.cache.get(id);
    if (s) {
        s.archived = 0;
        s.$emitter.emit('restored');
        Subscription.emit('restore', s);
    }
});

socket.on('subscriptions:created', (data: SubscriptionObj) => {
    if (!Subscription.cache.has(data.id)) {
        const s = new Subscription(data);
        s.$emitter.emit('created');
        Subscription.emit('create', s);
    }
});

socket.on('subscriptions:updated', (data: SubscriptionObj) => {
    if (Subscription.cache.has(data.id)) {
        const s = Subscription.cache.get(data.id) as Subscription;
        Object.assign(s, data);
        s.$emitter.emit('updated');
        Subscription.emit('update', s);
    }
});