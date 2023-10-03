import { Route } from "../structure/app.ts";
import Account from "../structure/accounts.ts";
import { Status } from "../utilities/status.ts";
import Role from "../structure/roles.ts";
import { StatusId } from "../../shared/status-messages.ts";

export const router = new Route();


// gets the account from the session
router.post('/get-account', async(req, res) => {
    const { account } = req.session;

    if (account) res.json(account.safe);
    else res.sendStatus('account:not-logged-in');
});


// gets all roles available
router.post('/get-roles', async(req, res) => {
    res.json(await Role.all());
});

router.get('/sign-in', (_req, res) => {
    res.sendTemplate('entries/account/sign-in');
});

router.get('/sign-up', (_req, res) => {
    res.sendTemplate('entries/account/sign-up');
});

router.post('/sign-in', Account.notSignedIn, (req, res) => {
    const { 
        username,
        password
    } = req.body;

    const account = Account.fromUsername(username);

    // send the same error for both username and password to prevent username enumeration
    if (!account) return res.sendStatus('account:incorrect-username-or-password');

    const hash = Account.hash(password, account.salt);
    if (hash !== account.key) 
        return Status
            .from('account:password-mismatch', req, { username: username })
            .send(res);
    if (!account.verified) return res.sendStatus('account:not-verified', { username });

    req.session.signIn(account);

    res.sendStatus('account:logged-in', { username });
});





router.post('/sign-up', Account.notSignedIn, async(req, res) => {
    const {
        username,
        password,
        confirmPassword,
        email,
        firstName,
        lastName
    } = req.body;

    if (password !== confirmPassword) return Status.from('account:password-mismatch', req).send(res);

    const status = await Account.create(
        username,
        password,
        email,
        firstName,
        lastName
    );
    res.sendStatus('account:' + status as StatusId, { username });
});







// req.session.account is always available when Account.allowRoles/Permissions is used
// however, typescript doesn't know that, so we have to cast it

router.post('/verify-account', Account.allowPermissions('verify'), async(req, res) => {
    const { username } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self')

    const a = Account.fromUsername(username);
    if (!a) return res.sendStatus('account:not-found');
    const status = await a.verify();
    res.sendStatus('account:' + status as StatusId, { username });
});







router.post('/reject-account', Account.allowPermissions('verify'), async(req, res) => {
    const { username } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self')

    const account = await Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    if (account.verified) return res.sendStatus('account:cannot-reject-verified');

    const status = await Account.delete(username);
    res.sendStatus('account:' + status as StatusId, { username });
});






router.post('/get-pending-accounts', Account.allowPermissions('verify'), async(req, res) => {
    const accounts = Account.unverifiedAccounts();
    res.json(accounts.map(a => a.safe({
        roles: true,
        memberInfo: true,
        permissions: true,
        email: true
    })));
});








router.post('/get-all', async (req, res) => {
    const accounts = await Account.all();
    res.json(accounts.map(a => a.safe));
});



router.post('/remove-account', Account.allowPermissions('editUsers'), (req, res) => {
    const { username } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const status = Account.delete(username);
    res.sendStatus('account:' + status as StatusId, { username });
});







router.post('/unverify-account', Account.allowPermissions('verify'), (req, res) => {
    const { username } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const a = Account.fromUsername(username);
    if (!a) return res.sendStatus('account:not-found');
    Status.from('account.' + a.unverify() as StatusId, req, { username }).send(res);
});





router.post('/add-role', Account.allowPermissions('editRoles'), (req, res) => {
    const { username, role } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    res.sendStatus('account:' + account.addRole(role)[0] as StatusId, { username, role });
});






router.post('/remove-role', Account.allowPermissions('editRoles'), (req, res) => {
    const { username, role } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const [status] = account.removeRole(role);
    Status.from('account.' + status as StatusId, req, { username, role }).send(res);
});