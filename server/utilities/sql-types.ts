// This file is used to typesafe queries to the database
// The array is the parameters for the query, and the second parameter is the return type

import { __root } from './env.ts';
import {
    Account,
    Member,
    MembershipStatus,
    Role,
    RolePermission,
} from '../../shared/db-types.ts';
import { SessionObj } from '../structure/sessions.ts';

export type Queries = {
    'sessions/delete': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'sessions/delete-all': [[], unknown];
    'sessions/update': [
        [
            {
                id: string;
                ip: string;
                latestActivity: number;
                accountId: string;
                userAgent: string;
                requests: number;
                prevUrl: string;
            },
        ],
        unknown,
    ];
    'sessions/all': [[], SessionObj];
    'sessions/get': [
        [
            {
                id: string;
            },
        ],
        SessionObj,
    ];
    'sessions/new': [
        [
            {
                id: string;
                ip: string;
                latestActivity: number;
                accountId: string;
                userAgent: string;
                prevUrl: string;
                requests: number;
                created: number;
            },
        ],
        unknown,
    ];
    'db/get-version': [
        [],
        {
            major: number;
            minor: number;
            patch: number;
        },
    ];
    'roles/from-id': [
        [
            {
                id: string;
            },
        ],
        Role,
    ];
    'roles/from-name': [
        [
            {
                name: string;
            },
        ],
        Role,
    ];
    'roles/all': [[], Role];
    'permissions/from-role': [
        [
            {
                role: string;
            },
        ],
        RolePermission,
    ];
    'account/from-username': [
        [
            {
                username: string;
            },
        ],
        Account,
    ];
    'account/from-email': [
        [
            {
                email: string;
            },
        ],
        Account,
    ];
    'account/from-verification-key': [
        [
            {
                verification: string;
            },
        ],
        Account,
    ];
    'account/from-password-change': [
        [
            {
                passwordChange: string;
            },
        ],
        Account,
    ];
    'account/unverified': [[], Account];
    'account/all': [[], Account];
    'account/new': [
        [
            {
                id: string;
                username: string;
                key: string;
                salt: string;
                firstName: string;
                lastName: string;
                email: string;
                verified: 0 | 1;
                verification: string;
                created: number;
                phoneNumber: string;
            },
        ],
        unknown,
    ];
    'account/unverify': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'account/delete': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'account/from-id': [
        [
            {
                id: string;
            },
        ],
        Account,
    ];
    'account/change-email': [
        [
            {
                id: string;
                email: string;
            },
        ],
        unknown,
    ];
    'account/verify': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'account/set-verification': [
        [
            {
                id: string;
                verification: string;
            },
        ],
        unknown,
    ];
    'account/roles': [
        [
            {
                id: string;
            },
        ],
        Role,
    ];
    'account/add-role': [
        [
            {
                accountId: string;
                roleId: string;
            },
        ],
        unknown,
    ];
    'account/remove-role': [
        [
            {
                accountId: string;
                roleId: string;
            },
        ],
        unknown,
    ];
    'account/update-picture': [
        [
            {
                id: string;
                picture: string;
            },
        ],
        unknown,
    ];
    'account/change-username': [
        [
            {
                id: string;
                username: string;
            },
        ],
        unknown,
    ];
    'account/request-email-change': [
        [
            {
                id: string;
                emailChange: string;
            },
        ],
        unknown,
    ];
    'account/change-password': [
        [
            {
                id: string;
                salt: string;
                key: string;
                passwordChange: null;
            },
        ],
        unknown,
    ];
    'account/request-password-change': [
        [
            {
                id: string;
                passwordChange: string;
            },
        ],
        unknown,
    ];
    'member/from-username': [
        [
            {
                username: string;
            },
        ],
        Member,
    ];
    'member/all': [[], Member];
    'member/update-status': [
        [
            {
                status: MembershipStatus;
                id: string;
            },
        ],
        unknown,
    ];
    'member/new': [
        [
            {
                id: string;
                status: MembershipStatus;
            },
        ],
        unknown,
    ];
    'member/delete': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'member/update-bio': [
        [
            {
                id: string;
                bio: string;
            },
        ],
        unknown,
    ];
    'member/update-title': [
        [
            {
                id: string;
                title: string;
            },
        ],
        unknown,
    ];
    'member/update-resume': [
        [
            {
                id: string;
                resume: string;
            },
        ],
        unknown,
    ];
    'member/add-to-board': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
    'member/remove-from-board': [
        [
            {
                id: string;
            },
        ],
        unknown,
    ];
};
