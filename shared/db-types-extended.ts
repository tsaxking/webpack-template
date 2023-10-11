export type Transaction = {
    id: string;
    amount: number;
    type: 'withdrawal' | 'deposit';
    status: 'pending' | 'completed' | 'failed';
    date: string;
    bucketId: string;
    description: string;
    subtypeId: string;
    taxDeductible: 0 | 1;
    archived: 0 | 1;
    picture: string|null;
};

export type Bucket = {
    id: string;
    created: number;
    name: string;
    description: string;
    archived: 0 | 1;
    type: 'debit' | 'credit' | 'savings';
};

export type BalanceCorrection = {
    id: string;
    date: number;
    balance: number; // in cents
    bucketId: string;
};

export type Miles = {
    id: string;
    amount: number;
    date: number;
    archived: 0 | 1;
};

export type Subscription = {
    id: string;
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
    archived: 0 | 1;
};

export type TransactionType = {
    id: string;
    name: string;
    dateCreated: number;
    dateModified: number;
};

export type Subtype = {
    id: string;
    name: string;
    dateCreated: number;
    dateModified: number;
    typeId: string;
    type: 'withdrawal' | 'deposit';
};