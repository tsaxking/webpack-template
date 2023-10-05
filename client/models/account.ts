import { ServerRequest } from "../utilities/requests";
import { AccountSafe } from "../../shared/db-types";
import { Member } from "./_member";
import { confirm } from "../utilities/notifications";

export class Account {
    static accounts: {
        [username: string]: Account;
    } = {};
    private static _current: Account | undefined;
    
    static get current(): Account | undefined {
        return this._current;
    };

    static set current(account: Account | undefined) {
        this._current = account;
    }

    static async all(): Promise<Account[]> {
        if (Object.keys(this.accounts).length) return Object.values(this.accounts);

        return (await ServerRequest.post<AccountSafe[]>('/account/get-all')).map(a => new Account(a));
    };

    public readonly member?: Member;
    public username: string;
    public firstName: string;
    public lastName: string;
    public email:string;
    public verified: 0 | 1;
    public created: number;
    public phoneNumber: string;
    public picture?: string;
    public roles: string[];
    

    constructor(safe: AccountSafe) {
        this.username = safe.username;
        this.firstName = safe.firstName;
        this.lastName = safe.lastName;
        this.email = safe.email;
        this.verified = safe.verified;
        this.created = safe.created;
        this.phoneNumber = safe.phoneNumber;
        this.picture = safe.picture;
        this.roles = safe.roles;

        Account.accounts[this.username] = this;
    }





    changePassword() {
        confirm('Change Password').then((res) => {
            if (res) {
                this.requestPasswordChange();
            }
        });
    }

    changeUsername(username: string) {
        return ServerRequest.post('/account/change-username', {
            username: this.username,
            newUsername: username
        });
    }

    async changePicture(files: FileList) {
        return ServerRequest.streamFiles('/account/change-picture', files, {
            username: this.username
        });
    }

    async changeFirstName(firstName: string) {
        return ServerRequest.post('/account/change-first-name', {
            username: this.username,
            firstName
        });
    }

    async changeLastName(lastName: string) {
        return ServerRequest.post('/account/change-last-name', {
            username: this.username,
            lastName
        });
    }

    async changeEmail(email: string) {
        return ServerRequest.post('/account/change-email', {
            username: this.username,
            email
        });
    }

    async addRole(role: string) {
        return ServerRequest.post('/account/add-role', {
            username: this.username,
            role
        });
    }

    async removeRole(role: string) {
        return ServerRequest.post('/account/remove-role', {
            username: this.username,
            role
        });
    }

    async requestPasswordChange() {
        return ServerRequest.post('/account/reset-password', {
            username: this.username
        });
    }
};