import { AccountNotifications as AN } from '../../server/utilities/tables';
import { Cache } from './cache';
import { EventEmitter } from '../../shared/event-emitter';
import { socket } from '../utilities/socket';
import { ServerRequest } from '../utilities/requests';

type AN_Updates = {
    read: boolean;
    delete: boolean;
};

type AN_GlobalUpdates = {
    new: AccountNotification;
    delete: AccountNotification;
    read: AccountNotification;
};

export class AccountNotification extends Cache<AN_Updates> {
    private static readonly emitter = new EventEmitter<AN_GlobalUpdates>();

    public static on = AccountNotification.emitter.on.bind(
        AccountNotification.emitter
    );
    public static off = AccountNotification.emitter.off.bind(
        AccountNotification.emitter
    );
    public static emit = AccountNotification.emitter.emit.bind(
        AccountNotification.emitter
    );
    public static once = AccountNotification.emitter.once.bind(
        AccountNotification.emitter
    );

    public static readonly cache = new Map<string, AccountNotification>();

    public static retrieve(data: AN) {
        if (AccountNotification.cache.has(data.id))
            return AccountNotification.cache.get(data.id)!;
        return new AccountNotification(data);
    }

    public readonly id: string;
    public readonly accountId: string;
    public type: string;
    public data: unknown;
    public readonly created: number;
    public read: boolean;
    public message: string;
    public title: string;

    constructor(obj: AN) {
        super();
        this.id = obj.id;
        this.accountId = obj.accountId;
        this.type = obj.type;
        this.data = JSON.parse(obj.data);
        this.created = +obj.created;
        this.read = obj.read;
        this.message = obj.message;
        this.title = obj.title;

        AccountNotification.cache.set(this.id, this);
    }

    public markRead(read: boolean) {
        return ServerRequest.post('/account-notifications/mark-read', {
            read,
            id: this.id
        });
    }

    public delete() {
        return ServerRequest.post('/account-notifications/delete', {
            id: this.id
        });
    }
}

socket.on('account-notifications:new', (data: AN) => {
    AccountNotification.emit('new', new AccountNotification(data));
});

socket.on('account-notifications:delete', (data: AN) => {
    const notif = AccountNotification.cache.get(data.id);
    if (notif) {
        AccountNotification.cache.delete(data.id);
        AccountNotification.emit('delete', notif);
    }
});

socket.on('account-notifications:mark-read', (data: AN) => {
    const notif = AccountNotification.cache.get(data.id);
    if (notif) {
        notif.read = data.read;
        AccountNotification.emit('read', notif);
    }
});
