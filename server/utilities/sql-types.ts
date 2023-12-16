// This file is used to typesafe queries to the database
// The array is the parameters for the query, and the second parameter is the return type



import { __root } from "./env.ts";
import { MembershipStatus, Account, Member, Role, AccountRole, RolePermission, Skill } from "../../shared/db-types.ts";
import { SessionObj } from "../structure/sessions.ts";
import { Transaction, Bucket, BalanceCorrection, Miles, Subscription, Subtype, TransactionType } from "../../shared/db-types-extended.ts";

export type Queries = {
    'sessions/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'sessions/delete-all': [
        [],
        unknown
    ],
    'sessions/update': [
        [{
            id: string,
            ip: string,
            latestActivity: number,
            accountId: string,
            userAgent: string,
            requests: number,
            prevUrl: string
        }],
        unknown
    ],
    'sessions/all': [
        [],
        SessionObj
    ],
    'sessions/get': [
        [{
            id: string
        }],
        SessionObj
    ],
    'sessions/new': [
        [{
            id: string,
            ip: string,
            latestActivity: number,
            accountId: string,
            userAgent: string,
            prevUrl: string,
            requests: number,
            created: number
        }],
        unknown
    ],
    'db/get-version': [
        [],
        {
            major: number,
            minor: number,
            patch: number
        }
    ],
    'roles/from-id': [
        [{
            id: string
        }],
        Role
    ],
    'roles/from-name': [
        [{
            name: string
        }],
        Role
    ],
    'roles/all': [
        [],
        Role
    ],
    'permissions/from-role': [
        [{
            role: string
        }],
        RolePermission
    ],
    'account/from-username': [
        [{
            username: string
        }],
        Account
    ],
    'account/from-email': [
        [{
            email: string
        }],
        Account
    ],
    'account/from-verification-key': [
        [{
            verification: string
        }],
        Account
    ],
    'account/from-password-change': [
        [{
            passwordChange: string
        }],
        Account
    ],
    'account/unverified': [
        [],
        Account
    ],
    'account/all': [
        [],
        Account
    ],
    'account/new': [
        [{
            id: string,
            username: string,
            key: string,
            salt: string,
            firstName: string,
            lastName: string,
            email: string,
            verified: 0 | 1,
            verification: string,
            created: number,
            phoneNumber: string
        }],
        unknown
    ],
    'account/unverify': [
        [{
            id: string
        }],
        unknown
    ],
    'account/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'account/from-id': [
        [{ 
            id: string
        }],
        Account
    ],
    'account/change-email': [
        [{
            id: string,
            email: string
        }],
        unknown
    ],
    'account/verify': [
        [{
            id: string
        }],
        unknown
    ],
    'account/set-verification': [
        [{
            id: string,
            verification: string
        }],
        unknown
    ],
    'account/roles': [
        [{
            id: string
        }],
        Role
    ],
    'account/add-role': [
        [{
            accountId: string,
            roleId: string
        }],
        unknown
    ],
    'account/remove-role': [
        [{
            accountId: string,
            roleId: string
        }],
        unknown
    ],
    'account/update-picture': [
        [{
            id: string,
            picture: string
        }],
        unknown
    ],
    'account/change-username': [
        [{
            id: string,
            username: string
        }],
        unknown
    ],
    'account/request-email-change': [
        [{
            id: string,
            emailChange: string
        }],
        unknown
    ],
    'account/change-password': [
        [{
            id: string,
            salt: string,
            key: string,
            passwordChange: null
        }],
        unknown
    ],
    'account/request-password-change': [
        [{
            id: string,
            passwordChange: string
        }],
        unknown
    ],
    'member/from-username': [
        [{
            username: string
        }],
        Member
    ],
    'member/all': [
        [],
        Member
    ],
    'member/update-status': [
        [{
            status: MembershipStatus,
            id: string
        }],
        unknown
    ],
    'member/new': [
        [{
            id: string,
            status: MembershipStatus
        }],
        unknown
    ],
    'member/delete': [
        [{
            id: string
        }],
        unknown
    ],
    'member/update-bio': [
        [{
            id: string,
            bio: string
        }],
        unknown
    ],
    'member/update-title': [
        [{
            id: string,
            title: string
        }],
        unknown
    ],
    'member/update-resume': [
        [{
            id: string,
            resume: string
        }],
        unknown
    ],
    'member/add-to-board': [
        [{
            id: string
        }],
        unknown
    ],
    'member/remove-from-board': [
        [{
            id: string
        }],
        unknown
    ],




    // ▀█▀ █▀▄ ▄▀▄ █▄ █ ▄▀▀ ▄▀▄ ▄▀▀ ▀█▀ █ ▄▀▄ █▄ █ ▄▀▀ 
    //  █  █▀▄ █▀█ █ ▀█ ▄█▀ █▀█ ▀▄▄  █  █ ▀▄▀ █ ▀█ ▄█▀ 
    'transactions/archived': [
        [],
        Transaction
    ],
    'transactions/deposits': [
        [],
        Transaction
    ],
    'transactions/from-bucket': [
        [{
            bucket: string
        }],
        Transaction
    ],
    'transactions/from-status': [
        [
            {
                status: 'pending' | 'completed' | 'failed'
            }
        ],
        Transaction
    ],
    'transactions/from-subtype': [
        [
            {
                subtypeId: string;
            }
        ],
        Transaction
    ],
    'transactions/from-tax-deductible': [
        [
            {
                taxDeductible: 0 | 1;
            }
        ],
        Transaction
    ],
    'transactions/from-type': [
        [
            {
                typeId: string;
            }
        ],
        Transaction
    ],
    'transactions/new': [
        [
            {
                id: string;
                amount: number;
                type: 'withdrawal' | 'deposit';
                status: 'pending' | 'completed' | 'failed';
                date: number;
                bucketId: string;
                description: string;
                subtypeId: string;
                taxDeductible: 0 | 1;
            }
        ],
        unknown
    ],
    'transactions/set-archive': [
        [
            {
                id: string;
                archived: 0 | 1;
            }
        ],
        unknown
    ],
    'transactions/update': [
        [
            {
                id: string;
                amount: number;
                type: 'withdrawal' | 'deposit';
                status: 'pending' | 'completed' | 'failed';
                date: number;
                bucketId: string;
                description: string;
                subtypeId: string;
                taxDeductible: 0 | 1;
            }
        ],
        unknown
    ],
    'transactions/withdrawals': [
        [],
        Transaction
    ],
    'transactions/between': [
        [{
            from: number;
            to: number;
            bucketId: string;
        }],
        Transaction
    ],
    'transactions/update-picture': [
        [{
            id: string;
            picture: string;
        }],
        unknown
    ],
    'transactions/from-id': [
        [{
            id: string;
        }],
        Transaction
    ],



    // ██▄ █ █ ▄▀▀ █▄▀ ██▀ ▀█▀ ▄▀▀ 
    // █▄█ ▀▄█ ▀▄▄ █ █ █▄▄  █  ▄█▀ 
    'buckets/all': [
        [],
        Bucket
    ],
    'buckets/archived': [
        [],
        Bucket
    ],
    'buckets/from-id': [
        [
            {
                id: string
            }
        ],
        Bucket
    ],
    'buckets/new': [
        [
            {
                id: string;
                description: string;
                created: number;
                type: 'debit' | 'credit' | 'savings';
                name: string;
            }
        ],
        unknown
    ],
    'buckets/set-archive': [
        [
            {
                id: string;
                archived: 0 | 1;
            }
        ],
        unknown
    ],
    'buckets/update': [
        [
            {
                id: string;
                description: string;
                created: number;
                type: 'debit' | 'credit' | 'savings';
                name: string;
            }
        ],
        unknown
    ],







    // ██▄ ▄▀▄ █   ▄▀▄ █▄ █ ▄▀▀ ██▀    ▄▀▀ ▄▀▄ █▀▄ █▀▄ ██▀ ▄▀▀ ▀█▀ █ ▄▀▄ █▄ █ 
    // █▄█ █▀█ █▄▄ █▀█ █ ▀█ ▀▄▄ █▄▄    ▀▄▄ ▀▄▀ █▀▄ █▀▄ █▄▄ ▀▄▄  █  █ ▀▄▀ █ ▀█ 

    'balance-correction/all': [
        [],
        BalanceCorrection
    ],
    'balance-correction/delete': [
        [
            {
                id: string;
            }
        ],
        unknown
    ],
    'balance-correction/new': [
        [
            {
                id: string;
                date: number;
                balance: number;
                bucketId: string;
            }
        ],
        unknown
    ],
    'balance-correction/update': [
        [
            {
                id: string;
                date: number;
                balance: number;
                bucketId: string;
            }
        ],
        unknown
    ],





    // █▄ ▄█ █ █   ██▀ ▄▀▀ 
    // █ ▀ █ █ █▄▄ █▄▄ ▄█▀ 
    'miles/active': [
        [],
        Miles
    ],
    'miles/archived': [
        [],
        Miles
    ],
    'miles/from-id': [
        [
            {
                id: string;
            }
        ],
        Miles
    ],
    'miles/new': [
        [
            {
                id: string;
                amount: number;
                date: number;
            }
        ],
        unknown
    ],
    'miles/set-archive': [
        [
            {
                id: string;
                archived: 0 | 1;
            }
        ],
        unknown
    ],
    'miles/update': [
        [
            {
                id: string;
                amount: number;
                date: number;
            }
        ],
        unknown
    ],





    // ▄▀▀ █ █ ██▄ ▄▀▀ ▄▀▀ █▀▄ █ █▀▄ ▀█▀ █ ▄▀▄ █▄ █ ▄▀▀ 
    // ▄█▀ ▀▄█ █▄█ ▄█▀ ▀▄▄ █▀▄ █ █▀   █  █ ▀▄▀ █ ▀█ ▄█▀ 
    'subscriptions/active': [
        [],
        Subscription
    ],
    'subscriptions/archived': [
        [],
        Subscription
    ],
    'subscriptions/new': [
        [
            {
                id: string;
                name: string;
                startDate: number;
                endDate: number|null;
                interval: number;
                bucketId: string;
                amount: number;
                subtypeId: string;
                description: string;
                picture: string|null;
                taxDeductible: 0 | 1;
            }
        ],
        unknown
    ],
    'subscriptions/set-archive': [
        [
            {
                id: string;
                archived: 0 | 1;
            }
        ],
        unknown
    ],
    'subscriptions/update': [
        [
            {
                id: string;
                name: string;
                startDate: number;
                endDate: number|null;
                interval: number;
                bucketId: string;
                amount: number;
                subtypeId: string;
                description: string;
                picture: string|null;
                taxDeductible: 0 | 1;
            }
        ],
        unknown
    ],
    'subscriptions/from-bucket': [
        [
            {
                bucketId: string;
            }
        ],
        Subscription
    ],
    'subscriptions/from-id': [
        [
            {
                id: string;
            }
        ],
        Subscription
    ],



    // ▀█▀ █▀▄ ▄▀▄ █▄ █ ▄▀▀ ▄▀▄ ▄▀▀ ▀█▀ █ ▄▀▄ █▄ █    ▀█▀ ▀▄▀ █▀▄ ██▀ ▄▀▀ 
    //  █  █▀▄ █▀█ █ ▀█ ▄█▀ █▀█ ▀▄▄  █  █ ▀▄▀ █ ▀█     █   █  █▀  █▄▄ ▄█▀ 
    'types/all-subtypes': [
        [],
        Subtype
    ],
    'types/all-types': [
        [],
        TransactionType
    ],
    'types/new-subtype': [
        [
            {
                id: string;
                name: string;
                dateCreated: number;
                dateModified: number;
                type: 'withdrawal' | 'deposit';
                typeId: string;
            }
        ],
        unknown
    ],
    'types/new-type': [
        [
            {
                id: string;
                name: string;
                dateCreated: number;
                dateModified: number;
            }
        ],
        unknown
    ],
    'types/subtype-from-type': [
        [
            {
                typeId: string;
            }
        ],
        Subtype
    ],
    'types/update-subtype': [
        [
            {
                name: string;
                dateCreated: number;
                dateModified: number;
                type: 'withdrawal' | 'deposit';
                typeId: string;
                id: string;
            }
        ],
        unknown
    ],
    'types/update-type': [
        [
            {
                name: string;
                dateCreated: number;
                dateModified: number;
                id: string;
            }
        ],
        unknown
    ]
};