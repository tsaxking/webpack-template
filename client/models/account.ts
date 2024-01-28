import { Cache } from './cache';

export class Account extends Cache {
    public static current?: Account;

    constructor() {
        super();
    }
}
