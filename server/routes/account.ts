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
router.post('/get-roles', (req, res) => {
    res.json(Role.all());
});

router.get('/sign-in', (_req, res) => {
    res.sendTemplate('entries/account/sign-in');
});

router.get('/sign-up', (_req, res) => {
    res.sendTemplate('entries/account/sign-up');
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
    username: string;
}>(
    '/verify-account',
    Account.allowPermissions('verify'),
    validate({
        username: 'string',
    }),
    async (req, res) => {
        const { username } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self');
        }

        const a = Account.fromUsername(username);
        if (!a) return res.sendStatus('account:not-found');
        const status = await a.verify();
        res.sendStatus(('account:' + status) as StatusId, { username });
    },
);

router.post<{
    username: string;
}>(
    '/reject-account',
    Account.allowPermissions('verify'),
    validate({
        username: 'string',
    }),
    (req, res) => {
        const { username } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self');
        }

        const account = Account.fromUsername(username);
        if (!account) return res.sendStatus('account:not-found', { username });

        if (account.verified) {
            return res.sendStatus('account:cannot-reject-verified');
        }

        const status = Account.delete(username);
        res.sendStatus(('account:' + status) as StatusId, { username });
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

router.post('/get-all', (_req, res) => {
    const accounts = Account.all;
    res.json(accounts.map((a) => a.safe));
});

router.post<{
    username: string;
}>(
    '/remove-account',
    Account.allowPermissions('editUsers'),
    validate({
        username: 'string',
    }),
    (req, res) => {
        const { username } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { username });
        }

        const status = Account.delete(username);
        res.sendStatus(('account:' + status) as StatusId, { username });
    },
);

router.post<{
    username: string;
}>(
    '/unverify-account',
    Account.allowPermissions('verify'),
    validate({
        username: 'string',
    }),
    (req, res) => {
        const { username } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { username });
        }

        const a = Account.fromUsername(username);
        if (!a) return res.sendStatus('account:not-found');
        Status.from(('account:' + a.unverify()) as StatusId, req, {
            username,
        }).send(res);
    },
);

router.post<{
    username: string;
    role: string;
}>(
    '/add-role',
    Account.allowPermissions('editRoles'),
    validate({
        username: 'string',
        role: 'string',
    }),
    (req, res) => {
        const { username, role } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { username });
        }

        const account = Account.fromUsername(username);
        if (!account) return res.sendStatus('account:not-found', { username });

        const status = account.addRole(role);
        if (!messages[('role:' + status) as keyof typeof messages]) {
            return res.sendStatus(('account:' + status) as StatusId, {
                username,
                role,
            });
        }
        res.sendStatus(('role:' + status) as StatusId, { username, role });
    },
);

router.post<{
    username: string;
    role: string;
}>(
    '/remove-role',
    Account.allowPermissions('editRoles'),
    validate({
        username: 'string',
        role: 'string',
    }),
    (req, res) => {
        const { username, role } = req.body;

        if (username === req.session.account?.username) {
            return res.sendStatus('account:cannot-edit-self', { username });
        }

        const account = Account.fromUsername(username);
        if (!account) return res.sendStatus('account:not-found', { username });

        const status = account.removeRole(role);
        if (!messages[('role:' + status) as keyof typeof messages]) {
            return res.sendStatus(('account:' + status) as StatusId, {
                username,
                role,
            });
        }
        res.sendStatus(('role:' + status) as StatusId, { username, role });
    },
);
