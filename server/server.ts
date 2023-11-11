import env, { __root } from "./utilities/env.ts";
import { log } from "./utilities/terminal-logging.ts";
import { App, ResponseStatus } from "./structure/app/app.ts";
import { Session } from "./structure/sessions.ts";
import * as path from 'node:path';
// import { emailValidation } from './middleware/spam-detection.ts';
import { getJSONSync, log as serverLog } from "./utilities/files.ts";
import { homeBuilder } from "./utilities/page-builder.ts";
import Account from "./structure/accounts.ts";
import { builder } from "./bundler.ts";
import { router as admin } from './routes/admin.ts';
import { router as account } from './routes/account.ts';
import { router as api } from './routes/api.ts';
import Role from "./structure/roles.ts";
import { validate } from "./middleware/data-type.ts";
import { uuid } from "./utilities/uuid.ts";
// import 'npm:@total-typescript/ts-reset';

const port = +(env.PORT || 3000);
const domain = env.DOMAIN || `http://localhost:${port}`;


export const app = new App(port, domain, {
    // onListen: () => {
        // log(`Listening on ${domain}`);
    // },
    // onConnection: (socket) => {
        // log('New connection:', socket.id);
    // },
    ioPort: +(env.SOCKET_PORT || port + 1)
});


// building client listeners
builder.on('build', () => {
    if (env.ENVIRONMENT === 'dev') app.io.emit('reload');
    log('Build complete');
});

builder.on('error', (e) => log('Build error:', e));

app.post('/test-stream', (req, res) => {
    const data = new Array(100).fill('').map(uuid);
    // console.log('Streaming', data);
    res.stream(data);
});


app.post('/test', (req, res, next) => {
    res.sendStatus('test:success');
});

app.post('/ping', (req, res) => {
    res.send('pong');
});

app.post('/test-validation', validate({
    username: (v: any) => v === 'fail', 
    password: (v: any) => v === 'test'
}, {
    onspam: (req, res, next) => {
        res.sendStatus('test:fail');
    }
}), (req, res, next) => {
    res.sendStatus('test:success');
});

app.use('/*', (req, res, next) => {
    log(`[${req.method}] ${req.url}`);
    next();
});

app.static('/client', path.resolve(__root, './client'));
app.static('/public', path.resolve(__root, './public'));
app.static('/dist', path.resolve(__root, './dist'));
app.static('/uploads', path.resolve(__root, './uploads'));

app.use('/*', Session.middleware());

app.post('/socket-url', (req, res, next) => {
    res.json({
        url: env.SOCKET_DOMAIN
    });
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/logo-square.png'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/robots.jpg'));
});

function stripHtml(body: any) {
    if (!body) return body;
    let files: any;

    if (body.files) {
        files = JSON.parse(JSON.stringify(body.files));
        delete body.files;
    }

    let obj: any = {};

    const remove = (str: string) => str.replace(/(<([^>]+)>)/gi, '');

    const strip = (obj: any): any => {
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
    }


    obj = strip(body);

    if (files) {
        obj.files = files;
    }

    return obj;
}

app.post('/*', (req, res, next) => {
    req.body = stripHtml(req.body);

    try {
        const b = JSON.parse(JSON.stringify(req.body)) as {
            $$files?: any;
            password?: string;
            confirmPassword?: string;
        }; // remove deep references
        delete b?.password;
        delete b?.confirmPassword;
        delete b?.$$files;
        console.log(b);
    } catch {
        console.log(req.body);
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


const homePages = getJSONSync('pages/home') as string[];

app.get('/', (req, res, next) => {
    res.redirect('/home');
});

app.get('/*', async (req, res, next) => {
    if (homePages.includes(req.url.slice(1))) {
        return res.send(
            await homeBuilder(req.url)
        );
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

app.use('/*', Account.autoSignIn(env.AUTO_SIGN_IN));

app.get('/*', (req, res, next) => {
    if (!req.session?.accountId) {
        req.session!.prevUrl = req.url;
        return res.redirect('/account/sign-in');
    }

    next();
});

app.route('/admin', admin);














app.get('/user/*', Account.isSignedIn,  (req, res, next) => {
    res.sendTemplate('entries/user');
});

app.get('/admin/*', Role.allowRoles('admin'), (req, res, next) => {
    res.sendTemplate('entries/admin');
});









app.final<{
    $$files?: any;
    password?: string;
    confirmPassword?: string;
}>((req, res) => {
    req.session.save();

    serverLog('request', {
        date: Date.now(),
        duration: Date.now() - req.start,
        ip: req.session?.ip,
        method: req.method,
        url: req.url,
        status: res._status,
        userAgent: req.headers.get('user-agent') || '',
        body: req.method == 'post' ? JSON.stringify((() => {
            let { body } = req;
            body = JSON.parse(JSON.stringify(body)) as {
    $$files?: any;
    password?: string;
    confirmPassword?: string;
};
            delete body?.password;
            delete body?.confirmPassword;
            delete body?.$$files;
            return body;
        })()) : '',
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query)
    });

    if (!res.fulfilled) {
        return res.sendStatus('page:not-found', { page: req.url });
    }
});
