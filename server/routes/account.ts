import { Route } from '../structure/app/app.ts';
import Account from '../structure/accounts.ts';
import { Status } from '../utilities/status.ts';
import Role from '../structure/roles.ts';
import { messages, StatusId } from '../../shared/status-messages.ts';
import { validate } from '../middleware/data-type.ts';

export const router = new Route();

// gets the account from the session
router.post('/get-account', async (req, res) => {
    const { account } = req.session;

    if (account) {
        res.json(
            account.safe({
                roles: true,
                memberInfo: true,
                permissions: true,
                email: true,
            }),
        );
    } else res.sendStatus('account:not-logged-in');
});

// gets all roles available
router.post('/get-all-roles', (req, res) => {
    res.json(Role.all());
});

router.get('/sign-in', (req, res, next) => {
    if (req.session.account) return next();
    res.sendTemplate('entries/account/sign-in');
});

router.get('/sign-up', (req, res, next) => {
    if (req.session.account) return next();
    res.sendTemplate('entries/account/sign-up');
});

router.get('/reset-password/:key', (req, res, next) => {
    const { key } = req.params;
    if (!key) return next();
    const a = Account.fromPasswordChangeKey(key);
    if (!a) return res.sendStatus('account:invalid-password-reset-key');
    res.sendTemplate('entries/account/reset-password');
});

router.post<{
    username: string;
    password: string;
}>(
    '/sign-in',
    Account.notSignedIn,
    validate({
        username: 'string',
        password: 'string',
    }),
    (req, res) => {
        const { username, password } = req.body;

        const account = Account.fromUsername(username) ||
            Account.fromEmail(username);

        // send the same error for both username and password to prevent username enumeration
        if (!account) {
            return res.sendStatus('account:incorrect-username-or-password');
        }

        const hash = Account.hash(password, account.salt);
        if (hash !== account.key) {
            return Status.from('account:password-mismatch', req, {
                username: username,
            }).send(res);
        }
        if (!account.verified) {
            return res.sendStatus('account:not-verified', {
                username,
            });
        }

        req.session.signIn(account);

        res.sendStatus('account:logged-in', { username });
    },
);

router.post<{
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    firstName: string;
    lastName: string;
}>(
    '/sign-up',
    Account.notSignedIn,
    validate({
        username: 'string',
        password: 'string',
        confirmPassword: 'string',
        email: 'string',
        firstName: 'string',
        lastName: 'string',
    }),
    async (req, res) => {
        const {
            username,
            password,
            confirmPassword,
            email,
            firstName,
            lastName,
        } = req.body;

        if (password !== confirmPassword) {
            return Status.from('account:password-mismatch', req).send(res);
        }

        const status = await Account.create(
            username,
            password,
            email,
            firstName,
            lastName,
        );

        res.sendStatus(('account:' + status) as StatusId, { username });
    },
);

// req.session.account is always available when Account.allowRoles/Permissions is used
// however, typescript doesn't know that, so we have to cast it

router.post<{
    id: string;
}>(
    '/verify',
    Account.allowPermissions('verify'),
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        if (id === req.session.account?.id) {
            return res.sendStatus('account:cannot-edit-self');
        }

        const a = Account.fromId(id);
        if (!a) return res.sendStatus('account:not-found');
        const status = a.verify();
        res.sendStatus(('account:' + status) as StatusId, { id });
    },
);

router.post<{
    id: string;
}>(
    '/reject',
    Account.allowPermissions('verify'),
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        if (id === req.session.account?.id) {
            return res.sendStatus('account:cannot-edit-self');
        }

        const account = Account.fromUsername(id);
        if (!account) return res.sendStatus('account:not-found', { id });

        if (account.verified) {
            return res.sendStatus('account:cannot-reject-verified');
        }

        const status = Account.delete(id);
        res.sendStatus(('account:' + status) as StatusId, { id });
    },
);

router.post(
    '/get-pending-accounts',
    Account.allowPermissions('verify'),
    (_req, res) => {
        const accounts = Account.unverifiedAccounts;
        res.json(
            accounts.map((a) =>
                a.safe({
                    roles: true,
                    memberInfo: true,
                    permissions: true,
                    email: true,
                })
            ),
        );
    },
);

router.post<{
    id: string;
}>(
    '/delete',
    Account.allowPermissions('editUsers'),
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        if (id === req.session.account?.id) {
            return res.sendStatus('account:cannot-edit-self', { id });
        }

        const status = Account.delete(id);
        res.sendStatus(('account:' + status) as StatusId, { id });
    },
);

router.post<{
    id: string;
}>(
    '/unverify',
    Account.allowPermissions('verify'),
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        if (id === req.session.account?.id) {
            return res.sendStatus('account:cannot-edit-self', { id });
        }

        const a = Account.fromId(id);
        if (!a) return res.sendStatus('account:not-found');
        Status.from(('account:' + a.unverify()) as StatusId, req, {
            id,
        }).send(res);
    },
);

router.post<{
    accountId: string;
    roleId: string;
}>(
    '/add-role',
    Account.allowPermissions('editRoles'),
    validate({
        accountId: 'string',
        roleId: 'string',
    }),
    (req, res) => {
        const { accountId, roleId } = req.body;

        if (accountId === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { accountId });
        }

        const account = Account.fromId(accountId);
        if (!account) return res.sendStatus('account:not-found', { accountId });

        const role = Role.fromId(roleId);
        if (!role) return res.sendStatus('role:not-found', { roleId });

        const status = account.addRole(role);
        if (!messages[('role:' + status) as keyof typeof messages]) {
            return res.sendStatus(('account:' + status) as StatusId, {
                accountId,
                role,
            });
        }
        res.sendStatus(('role:' + status) as StatusId, { accountId, role });
    },
);

router.post<{
    accountId: string;
    roleId: string;
}>(
    '/remove-role',
    Account.allowPermissions('editRoles'),
    validate({
        accountId: 'string',
        roleId: 'string',
    }),
    (req, res) => {
        const { accountId, roleId } = req.body;

        if (accountId === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { accountId });
        }

        const account = Account.fromId(accountId);
        if (!account) return res.sendStatus('account:not-found', { accountId });

        const role = Role.fromId(roleId);
        if (!role) return res.sendStatus('role:not-found', { roleId });

        const status = account.removeRole(role);
        if (!messages[('role:' + status) as keyof typeof messages]) {
            return res.sendStatus(('account:' + status) as StatusId, {
                accountId,
                roleId,
            });
        }
        res.sendStatus(('role:' + status) as StatusId, { accountId, roleId });
    },
);

router.post<{
    settings: string;
}>(
    '/set-settings',
    validate({
        settings: 'string',
    }),
    (req, res) => {
        const { settings } = req.body;

        const account = req.session.account;
        if (!account) return res.sendStatus('account:not-logged-in');

        try {
            account.settings = JSON.parse(settings);
        } catch (e) {
            return res.sendStatus('account:invalid-settings');
        }

        res.sendStatus('account:settings-set', {
            settings,
            id: account.id,
        });

        req.session.emit('account:settings-set', settings);
    },
);

router.post('/get-settings', (req, res) => {
    const account = req.session.account;
    if (!account) return res.status(404).json({ error: 'Not logged in' });

    res.json(
        account.settings
            ? JSON.parse(account.settings.settings || '[]')
            : undefined,
    );
});

router.post('/request-password-reset', validate({}), (req, res) => {
    const a = req.session.account;
    if (!a) return res.sendStatus('account:not-logged-in');

    a.requestPasswordChange();

    res.sendStatus('account:password-reset-request');
});

router.post<{
    password: string;
    confirmPassword: string;
    key: string;
}>(
    '/reset-password',
    validate({
        password: 'string',
        confirmPassword: 'string',
        key: 'string',
    }),
    (req, res) => {
        const { password, confirmPassword, key } = req.body;

        const a = Account.fromPasswordChangeKey(key);

        if (!a) return res.sendStatus('account:invalid-password-reset-key');

        if (password !== confirmPassword) {
            return res.sendStatus('account:password-mismatch');
        }

        a.changePassword(key, password);

        res.sendStatus('account:password-reset-success');
    },
);

router.post<{
    id: string;
}>(
    '/get-roles',
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        const { account } = req.session;
        if (!account) return res.sendStatus('account:not-logged-in');

        if (account.id !== id) {
            const perms = account.permissions;
            if (perms.includes('editRoles')) {
                const roles = Account.fromId(id)?.roles;
                if (roles) {
                    return res.json(roles);
                } else {
                    return res.json([]);
                }
            }

            return res.sendStatus('account:cannot-edit-other-account');
        }

        res.json(account.roles);
    },
);

router.post<{
    id: string;
}>(
    '/get-permissions',
    validate({
        id: 'string',
    }),
    (req, res) => {
        const { id } = req.body;

        const { account } = req.session;
        if (!account) return res.sendStatus('account:not-logged-in');

        if (account.id !== id) {
            const perms = account.permissions;
            if (perms.includes('editRoles')) {
                const permissions = Account.fromId(id)?.permissions;
                if (permissions) {
                    return res.json(permissions);
                } else {
                    return res.json([]);
                }
            }

            return res.sendStatus('account:cannot-edit-other-account');
        }

        res.json(account.permissions);
    },
);

router.post('/all', (req, res) => {
    const { account } = req.session;
    if (!account) return res.sendStatus('account:not-logged-in');

    if (account.permissions.includes('admin')) {
        return res.json(
            Account.all.map((a) =>
                a.safe({
                    roles: true,
                    email: true,
                    memberInfo: true,
                    permissions: true,
                    id: true,
                })
            ),
        );
    }

    return res.sendStatus('account:insufficient-permissions');
});
