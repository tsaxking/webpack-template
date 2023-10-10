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

        return ServerRequest.post<SubscriptionObj[]>('/api/subscriptions/get-all')
            .then((subs) => {
                return subs.map((s) => new Subscription(s));
            });
    }

    static async getArchived(): Promise<Subscription[]> {
        if (Subscription.cache.size > 0) {
            return Array.from(Subscription.cache.values()).filter((s) => s.archived);
        }

        return ServerRequest.post<SubscriptionObj[]>('/api/subscriptions/get-archived')
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
        if (Subscription.cache.size > 0) {
            return Array.from(Subscription.cache.values()).filter((s) => s.bucketId === bucketId);
        }

        return ServerRequest.post<SubscriptionObj[]>('/api/subscriptions/from-bucket', {
            bucketId
        }).then((subs) => {
            return subs.map((s) => new Subscription(s));
        });
    }

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
        return ServerRequest.post('/update', {
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
    }
});

socket.on('subscriptions:restored', (id: string) => {
    const s = Subscription.cache.get(id);
    if (s) {
        s.archived = 0;
        s.$emitter.emit('restored');
    }
});

socket.on('subscriptions:created', (data: SubscriptionObj) => {
    if (!Subscription.cache.has(data.id)) {
        new Subscription(data).$emitter.emit('created');
    }
});

socket.on('subscriptions:updated', (data: SubscriptionObj) => {
    if (Subscription.cache.has(data.id)) {
        const s = Subscription.cache.get(data.id) as Subscription;
        Object.assign(s, data);
        s.$emitter.emit('updated');
    }
});