import env, { __root, resolve } from './utilities/env.ts';
import { log } from './utilities/terminal-logging.ts';
import { App, ResponseStatus } from './structure/app/app.ts';
import { getJSON, log as serverLog } from './utilities/files.ts';
import { homeBuilder } from './utilities/page-builder.ts';
import Account from './structure/accounts.ts';
import { router as admin } from './routes/admin.ts';
import { router as account } from './routes/account.ts';
import { router as api } from './routes/api.ts';
import { router as role } from './routes/roles.ts';
import Role from './structure/roles.ts';
import { FileUpload } from './middleware/stream.ts';
import { ReqBody } from './structure/app/req.ts';
import { parseCookie } from '../shared/cookie.ts';
import { stdin } from './utilities/stdin.ts';
import { io, Socket } from './structure/socket.ts';

const port = +(env.PORT || 3000);

export const app = new App(port, env.DOMAIN || `http://localhost:${port}`, {
    // onListen: () => {
    // log(`Listening on ${domain}`);
    // },
    // onConnection: (socket) => {
    // log('New connection:', socket.id);
    // },
    ioPort: +(env.SOCKET_PORT || port + 1),
});

if (env.ENVIRONMENT === 'dev') {
    stdin.on('rb', () => {
        console.log('Reloading clients...');
        app.io.emit('reload');
    });
}

app.post('/socket', io.middleware());

io.on('connection', (s: Socket) => {
    log('New connection:', s.id);
    s.on('disconnect', () => {
        log('Disconnected:', s.id);
    });
});

app.post('/env', (req, res) => {
    res.json({
        ENVIRONMENT: env.ENVIRONMENT,
    });
});

app.post('/socket-init', (req, res) => {
    const cookie = req.headers.get('cookie');
    res.json(parseCookie(cookie));
});

app.get('/*', (req, res, next) => {
    log(`[${req.method}] ${req.pathname}`);
    next();
});

app.static('/client', resolve(__root, './client'));
app.static('/public', resolve(__root, './public'));
app.static('/dist', resolve(__root, './dist'));
app.static('/uploads', resolve(__root, './storage/uploads'));

app.post('/socket-url', (req, res) => {
    res.json({
        url: env.SOCKET_DOMAIN,
    });
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(resolve(__root, './public/pictures/logo-square.png'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(resolve(__root, './public/pictures/robots.jpg'));
});

function stripHtml(body: ReqBody) {
    if (!body) return body;
    let files: unknown;

    if (body.$$files) {
        files = JSON.parse(JSON.stringify(body.$$files));
        delete body.files;
    }

    let obj: ReqBody = {};

    const remove = (str: string) => str.replace(/(<([^>]+)>)/gi, '');

    const strip = (obj: unknown): unknown => {
        switch (typeof obj) {
            case 'string':
                return remove(obj);
            case 'object':
                if (Array.isArray(obj)) {
                    return obj.map(strip);
                }
                for (const key in obj) {
                    obj[key] = strip(obj[key]);
                }
                return obj;
            default:
                return obj;
        }
    };

    obj = strip(body) as ReqBody;

    if (files) {
        obj.$$files = files;
    }

    return obj;
}

app.post('/*', (req, res, next) => {
    req.body = stripHtml(req.body as ReqBody);

    log('[POST]', req.url.pathname);
    try {
        const b = JSON.parse(JSON.stringify(req.body)) as {
            $$files?: FileUpload[];
            password?: string;
            confirmPassword?: string;
        }; // remove deep references
        delete b?.password;
        delete b?.confirmPassword;
        delete b?.$$files;
        log(b);
    } catch {
        log(req.body);
    }

    next();
});

// TODO: There is an error with the email validation middleware
// app.post('/*', emailValidation(['email', 'confirmEmail'], {
//     onspam: (req, res, next) => {
//         res.sendStatus('spam:detected');
//     },
//     // onerror: (req, res, next) => {
//     //     // res.sendStatus('unknown:error');
//     //     next();
//     // }
// }));

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/*', async (req, res, next) => {
    const homePages = await getJSON<string[]>('pages/home');
    if (homePages.isOk()) {
        if (homePages.value.includes(req.url.href.slice(1))) {
            const r = await homeBuilder(req.url.pathname);
            if (r.isOk()) res.send(r.value);
        }
    }
    next();
});

app.get('/test/:page', (req, res, next) => {
    if (env.ENVIRONMENT !== 'dev') return next();
    const s = res.sendTemplate('entries/test/' + req.params.page);
    if (s === ResponseStatus.error || s === ResponseStatus.fileNotFound) {
        res.sendStatus('page:not-found', { page: req.params.page });
    }
});

app.route('/api', api);
app.route('/account', account);
app.route('/roles', role);

app.use('/*', Account.autoSignIn(env.AUTO_SIGN_IN));

app.get('/*', (req, res, next) => {
    if (!req.session.accountId) {
        if (
            ![
                '/account/sign-in',
                '/account/sign-up',
                '/account/forgot-password',
            ].includes(req.url.pathname)
        ) {
            // only save the previous url if it's not a sign-in, sign-up, or forgot-password page
            // this is so that the user can be redirected back to the page they initially were trying to access
            req.session.prevUrl = req.url.href;
        }
        return res.redirect('/account/sign-in');
    }

    next();
});

app.get('/dashboard/admin', Role.allowRoles('admin'), (_req, res) => {
    res.sendTemplate('entries/dashboard/admin');
});

app.route('/admin', admin);

app.get('/dashboard/:dashboard', (req, res) => {
    res.sendTemplate('entries/dashboard/' + req.params.dashboard);
});

app.get('/user/*', Account.isSignedIn, (req, res) => {
    res.sendTemplate('entries/user');
});

app.final<{
    $$files?: FileUpload;
    password?: string;
    confirmPassword?: string;
}>((req, res) => {
    // req.session.save();

    serverLog('request', {
        date: Date.now(),
        duration: Date.now() - req.start,
        ip: req.session?.ip,
        method: req.method,
        url: req.url.pathname,
        status: res._status,
        userAgent: req.headers.get('user-agent') || '',
        body: req.method == 'post'
            ? JSON.stringify(
                (() => {
                    let { body } = req;
                    body = JSON.parse(JSON.stringify(body)) as {
                        $$files?: FileUpload;
                        password?: string;
                        confirmPassword?: string;
                    };
                    delete body?.password;
                    delete body?.confirmPassword;
                    delete body?.$$files;
                    return body;
                })(),
            )
            : '',
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query),
    });

    if (!res.fulfilled) {
        res.sendStatus('page:not-found');
    }
});
