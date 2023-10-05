import { Route } from "../structure/app.ts";
import { Member } from "../structure/member.ts";
import Account from "../structure/accounts.ts";
import { fileStream } from "../middleware/stream.ts";





export const router = new Route();


router.get('/become-member', (req, res) => {
    res.sendTemplate('entries/member/become-member');
});


router.post('/status', (req, res) => {
    const { account } = req.session;

    if (!account) return res.sendStatus('account:not-logged-in');

    const member = Member.get(account.username);

    if (!member) return res.json({
        membershipStatus: 'not-member'
    });

    res.json({
        membershipStatus: member.status
    });
});



router.post('/request', (req, res) => {
    const { account } = req.session;

    if (!account) return res.sendStatus('account:not-logged-in');

    const member = Member.get(account.username);
    if (member) return res.sendStatus('member:already-member');

    const status = Member.newMember(account);

    res.sendStatus('member:request-sent');
    req.io.emit('member:request-sent', account.username);
    req.io.emit('member:status-updated', account.username, status);
});


router.post('/accept', Account.allowPermissions('manageMembers'), async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.sendStatus('member:invalid-request');
    }


    const member = Member.get(username);

    if (!member) return res.sendStatus('member:not-member');

    if (member.status === 'pending' || member.status === 'twice-pending') {
        member.accept();
        res.sendStatus('member:accepted');
        req.io.emit('member:accepted', username);
        return;
    }

    res.sendStatus('member:membership-responded');
});

router.post('/reject', Account.allowPermissions('manageMembers'), (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.sendStatus('member:invalid-request');
    }

    const member = Member.get(username);

    if (!member) return res.sendStatus('member:not-member');

    if (member.status === 'pending' || member.status === 'twice-pending') {
        member.reject();
        res.sendStatus('member:rejected');
        req.io.emit('member:rejected', username);
        return;
    }

    res.sendStatus('member:membership-responded');
});

router.post('/revoke', Account.allowPermissions('manageMembers'), (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.sendStatus('member:invalid-request');
    }

    const member = Member.get(username);

    if (!member) return res.sendStatus('member:not-member');

    if (member.status === 'accepted') {
        member.revoke();
        res.sendStatus('member:revoked');
        req.io.emit('member:revoked', username);
        return;
    }

    res.sendStatus('member:not-member');
});

router.post('/get-members', (req, res) => {
    res.json(Member.getMembers().map(m => m.safe()));
})






router.post('/change-bio', (req, res) => {
    const { username, bio } = req.body;

    if (!username || !bio) {
        return res.sendStatus('member:invalid-request');
    }

    const m = Member.get(username);

    if (!m) return res.sendStatus('member:not-member');

    m.changeBio(bio);

    res.sendStatus('member:update-bio');
    req.io.emit('member:update-bio', username, bio);
});


router.post('/change-title', (req, res) => {
    const { username, title } = req.body;

    if (!username || !title) {
        return res.sendStatus('member:invalid-request');
    }

    const m = Member.get(username);

    if (!m) return res.sendStatus('member:not-member');

    m.changeTitle(title);

    res.sendStatus('member:update-title');
    req.io.emit('member:update-title', username, title);
});

router.post('/change-resume', fileStream({
    maxFileSize: 1000000,
    extensions: ['.pdf']
}), (req, res) => {
    const [file] = req.files;
    const { username } = req.body;

    if (!file) {
        res.sendStatus('files:invalid');
    }

    const m = Member.get(username);
    if (!m) return res.sendStatus('member:not-member');

    m.changeResume(file.id);

    res.sendStatus('member:update-resume');
    req.io.emit('change-resume', username, file.id);
});

router.post('/add-skill', (req, res) => {
    const { username, skill, years } = req.body;

    if (!username || !skill || !years) {
        return res.sendStatus('member:invalid-request');
    }

    const m = Member.get(username);

    if (!m) return res.sendStatus('member:not-member');

    m.addSkill(skill, years);

    res.sendStatus('member:add-skill');
    req.io.emit('member:add-skill', username, skill, years);
});

router.post('/remove-skill', (req, res) => {
    const { username, skill } = req.body;

    if (!username || !skill) {
        return res.sendStatus('member:invalid-request');
    }

    const m = Member.get(username);

    if (!m) return res.sendStatus('member:not-member');

    m.removeSkill(skill);

    res.sendStatus('member:remove-skill');
    req.io.emit('member:remove-skill', username, skill);
});