{
    const parse = (ts: string) => {
        // console.log(ts);
        // ts is a typescript file
        // parse it for the generic
        // (router|app).(get/post/use/final)<{generic}>(path, ...middleware, callback);

        const generic = /(router|app)\.(get|post|use|final)<{([\s\S]+?)}>/g;
        const middleware = /(router|app)\.(get|post|use|final)\(([\s\S]+?)\)/g;

        const generics = Array.from(ts.matchAll(generic)).map(m => {
            const [_, _router, _method, generic] = m as string[];

            return {
                generic
            };
        });

        const middlewares = Array.from(ts.matchAll(middleware)).map(m => {
            const [_, _router, _method, middleware] = m as string[];

            return {
                middleware
            };
        });

        return {
            generics,
            middlewares
        };
    };

    console.log(
        parse(`
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
}>('/sign-in', Account.notSignedIn, validate({
    username: (v: any) => typeof v == 'string',
    password: (v: any) => typeof v == 'string'
}), (req, res) => {
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





router.post<{
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    firstName: string;
    lastName: string;
}>('/sign-up', Account.notSignedIn, validate({
    username: (v: any) => typeof v == 'string',
    password: (v: any) => typeof v == 'string',
    confirmPassword: (v: any) => typeof v == 'string',
    email: (v: any) => typeof v == 'string',
    firstName: (v: any) => typeof v == 'string',
    lastName: (v: any) => typeof v == 'string'
}), async(req, res) => {
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
`)
    );
}
