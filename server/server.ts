import env, { __root } from './utilities/env';
import { log } from './utilities/terminal-logging';
import { App } from './structure/app/app';
import { getJSON, log as serverLog } from './utilities/files';
import { homeBuilder } from './utilities/page-builder';
import { router as admin } from './routes/admin';
import { router as api } from './routes/api';
import { FileUpload } from './middleware/stream';
import { ReqBody } from './structure/app/req';
import { parseCookie } from '../shared/cookie';
import path from 'path';
import { DB } from './utilities/database';
import { Struct } from './structure/structs/struct';
import { Account } from './structure/structs/account';
import { Permissions } from './structure/structs/permissions';

import './structure/structs/account';
import './structure/structs/permissions';
import './structure/structs/session';
import './structure/structs/email';
import './structure/structs/test';

if (process.argv.includes('--stats')) {
    const measure = () => {
        console.clear();
        const { rss, heapUsed, heapTotal } = process.memoryUsage();
        console.log('rss:', rss / 1024 / 1024, 'MB');
        console.log('heap:', heapUsed / 1024 / 1024, 'MB');
        console.log('total:', heapTotal / 1024 / 1024, 'MB');
    };
    setInterval(measure, 1000);
}

const port = +(env.PORT || 3000);

export const app = new App(port, env.DOMAIN || `http://localhost:${port}`);

app.post('/env', (req, res) => {
    res.json({
        ENVIRONMENT: env.ENVIRONMENT
    });
});

app.post('/socket-init', (req, res) => {
    const cookie = req.headers.get('cookie');
    res.json(parseCookie(cookie || ''));
});

app.use('/*', (req, res, next) => {
    log(`[${req.method}] ${req.originalUrl}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // res.setHeader('Access-Control-Allow-Headers', '*');
    // res.setHeader('Access-Control-Allow-Methods', '*');
    // res.setHeader('Access-Control-Expose-Headers', '*');
    next();
});

// app.use('/*', Permissions.forceUniverse(async () => {
//     const universes = (await Permissions.Universe.all(false)).unwrap();
//     return universes.find(u => u.data.name === 'test');
// }));

app.static('/client', path.resolve(__root, './client'));
app.static('/public', path.resolve(__root, './public'));
app.static('/dist', path.resolve(__root, './dist'));
app.static('/uploads', path.resolve(__root, './storage/uploads'));

app.post('/test/get-socket', (req, res) => {
    res.json({
        id: req.socket?.id || 'Not found!'
    });
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/logo-square.png'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/robots.jpg'));
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strip = (obj: any): unknown => {
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

app.get('/', (_, res) => {
    res.redirect('/home');
});

app.get('/*', async (req, res, next) => {
    const homePages = await getJSON<string[]>('pages/home');
    if (homePages.isOk()) {
        if (homePages.value.includes(req.url.slice(1))) {
            const r = await homeBuilder(req.url);
            if (r.isOk()) res.send(r.value);
        }
    }
    next();
});

app.get('/test/:page', (req, res, next) => {
    if (!['dev', 'test'].includes(env.ENVIRONMENT as string)) return next();
    const s = res.sendTemplate('entries/test/' + req.params.page);
    if (s.isErr()) {
        res.sendStatus('page:not-found', { page: req.params.page });
    }
});

app.route('/API', Struct.router);
app.route('/api', api);
app.use('/*', Account.autoSignIn(env.AUTO_SIGN_IN || ''));

app.get('/*', async (req, res, next) => {
    if (env.ENVIRONMENT === 'test') return next();
    const s = (await req.getSession()).unwrap();
    if (!s.data.accountId) {
        if (
            ![
                '/account/sign-in',
                '/account/sign-up',
                '/account/forgot-password'
            ].includes(req.url)
        ) {
            // only save the previous url if it's not a sign-in, sign-up, or forgot-password page
            // this is so that the user can be redirected back to the page they initially were trying to access
            (
                await s.update({
                    prevUrl: req.url
                })
            ).unwrap();
        }
        return res.redirect('/account/sign-in');
    }

    next();
});

app.get(
    '/dashboard/admin',
    Permissions.canAccess(async account => {
        return (await Account.isAdmin(account)).unwrap();
    }),
    (_req, res) => {
        res.sendTemplate('entries/dashboard/admin');
    }
);

app.route('/admin', admin);

app.get('/dashboard/:dashboard', (req, res) => {
    res.sendTemplate('entries/dashboard/' + req.params.dashboard);
});

app.get('/user/*', Account.isSignedIn, (req, res) => {
    res.sendTemplate('entries/user');
});

app.get('/*', (req, res) => {
    if (!res.fulfilled) {
        res.sendStatus('page:not-found', { page: req.pathname });
    }
});

app.final<{
    $$files?: FileUpload;
    password?: string;
    confirmPassword?: string;
}>(async (req, res) => {
    // req.session.save();

    if (res.fulfilled) {
        serverLog('request', {
            date: Date.now(),
            duration: Date.now() - req.start,
            ip: (await req.getSession()).unwrap().data.ip,
            method: req.method,
            url: req.pathname,
            status: res._status,
            userAgent: req.headers.get('user-agent') || '',
            // body: '',
            body:
                req.method == 'post' && req.body
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
                          })()
                      )
                    : '',
            params: JSON.stringify(req.params),
            query: JSON.stringify(req.query)
        });
    }
});

DB.connect().then(async res => {
    res.unwrap();
    (await DB.init()).unwrap();

    Struct.buildAll(true).then(res => {
        if (res.isErr()) throw res.error;
        app.start();
    });
});
