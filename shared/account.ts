


export class Account {
    constructor(
        readonly id: string,
        readonly name: string,
        readonly email: string,
        readonly password: string,
        readonly created_at: Date,
        readonly updated_at: Date
    ) {};
}