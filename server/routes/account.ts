import { Route } from "../structure/app.ts";
import Account from "../structure/accounts.ts";
import { Status } from "../utilities/status.ts";
import Role from "../structure/roles.ts";
import { StatusId, messages } from "../../shared/status-messages.ts";
import { log } from "../utilities/terminal-logging.ts";
import { fileStream } from "../middleware/stream.ts";

export const router = new Route();


// gets the account from the session
router.post('/get-account', async(req, res) => {
    const { account } = req.session;

    if (account) res.json(account.safe);
    else res.sendStatus('account:not-logged-in');
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







router.post('/reject-account', Account.allowPermissions('verify'), (req, res) => {
    const { username } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self')

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    if (account.verified) return res.sendStatus('account:cannot-reject-verified');

    const status = Account.delete(username);
    res.sendStatus('account:' + status as StatusId, { username });
});






router.post('/get-pending-accounts', Account.allowPermissions('verify'), (_req, res) => {
    const accounts = Account.unverifiedAccounts();
    res.json(accounts.map(a => a.safe({
        roles: true,
        memberInfo: true,
        permissions: true,
        email: true
    })));
});








router.post('/get-all', (_req, res) => {
    log('Getting all accounts');

    const accounts = Account.all();
    res.json(accounts.map(a => a.safe()));
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
    Status.from('account:' + a.unverify() as StatusId, req, { username }).send(res);
});





router.post('/add-role', Account.allowPermissions('editRoles'), (req, res) => {
    const { username, role } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.addRole(role);
    if (!messages[('role:' + status) as keyof typeof messages]) return res.sendStatus('account:' + status as StatusId, { username, role });
    res.sendStatus('role:' + status as StatusId, { username, role });
});






router.post('/remove-role', Account.allowPermissions('editRoles'), (req, res) => {
    const { username, role } = req.body;

    if (username === req.session.account?.username) return res.sendStatus('account:cannot-edit-self', { username });

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.removeRole(role);
    if (!messages[('role:' + status) as keyof typeof messages]) return res.sendStatus('account:' + status as StatusId, { username, role });
    res.sendStatus('role:' + status as StatusId, { username, role });
});



router.post('/change-username', Account.allowPermissions('editUsers'), (req, res) => {
    const { username, newUsername } = req.body;

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.changeUsername(newUsername);
    res.sendStatus('account:' + status as StatusId, { username, newUsername });
    
    if (status === 'username-changed') {
        req.io.emit('account:change-username', username, newUsername);
    }
});

router.post('/change-email', Account.allowPermissions('editUsers'), (req, res) => {
    const { username, newEmail } = req.body;

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.changeEmail(newEmail);

    res.sendStatus('account:' + status as StatusId, { username, newEmail });

    req.io.emit('account:change-email', username, newEmail);
});


router.post('/change-first-name', Account.allowPermissions('editUsers'), async(req, res) => {
    const { username, newFirstName } = req.body;

    const account = await Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.changeFirstName(newFirstName);

    res.sendStatus('account:' + status as StatusId, { username, newFirstName });

    req.io.emit('account:change-first-name', username, newFirstName);
});

router.post('/change-last-name', Account.allowPermissions('editUsers'), async(req, res) => {
    const { username, newLastName } = req.body;

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.changeLastName(newLastName);

    res.sendStatus('account:' + status as StatusId, { username, newLastName });

    req.io.emit('account:change-last-name', username, newLastName);
});

router.post('/change-picture', fileStream({
    extensions: [
        'png',
        'jpg',
        'jpeg'
    ],
    maxFileSize: 1024 * 1024 * 5
}), async(req, res) => {
    const { username } = req.body;

    const [file] = req.files;

    const id = file?.id;
    if (!id) return res.sendStatus('account:invalid-picture');

    const account = Account.fromUsername(username);
    if (!account) return res.sendStatus('account:not-found', { username });

    const status = account.changePicture(id + file.ext);

    res.sendStatus('account:' + status as StatusId, { username });

    req.io.emit('account:change-picture', username, id + file.ext);
});
