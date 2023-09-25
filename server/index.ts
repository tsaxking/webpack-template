import env, { __root } from "./utilities/env.ts";
import { log } from "./utilities/terminal-logging.ts";
import { App } from "./structure/app.ts";
import { Req, Res, Next } from "./structure/app.ts";
import { Session } from "./structure/sessions.ts";
import * as path from 'node:path';
import { emailValidation } from './middleware/spam-detection.ts';
import { getJSONSync } from "./utilities/files.ts";
import { Status } from "./utilities/status.ts";
import { homeBuilder } from "./utilities/page-builder.ts";
import Account from "./structure/accounts.ts";



const port = +env.PORT || 3000;
const domain = env.DOMAIN || `http://localhost:${port}`;

const app = new App(port, domain, {
    onListen: () => {
        log(`Listening on ${domain}`);
    }
});


app.static('/static', './dist');
app.static('/uploads', './uploads');

app.get('/*', (req, res, next) => {
    log(`[${req.method}] ${req.url}`);
    next();
});

app.use('/*', Session.middleware({
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 * 52 * 10 // 10 years
    },
    // requests: {
    //     perMinute: 100,
    //     onOverload: (session) => {

    //     }
    // }
}));


app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__root, './client/pictures/logo-square.png'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(__root, './client/pictures/robots.jpg'));
});

function stripHtml(body: any) {
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
    console.log(req.body);
    next();
});



app.post('/*', emailValidation(['email', 'confirmEmail'], {
    onspam: (req, res, next) => {
        Status.from('spam', req).send(res);
    },
    onerror: (req, res, next) => {
        Status.from('spam', req).send(res);
    }
}));


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

app.use('/*', Account.autoSignIn(env.AUTO_SIGN_IN));

app.get('/*', (req, res, next) => {
    if (!req.session?.accountId) {
        req.session!.prevUrl = req.url;
        return res.redirect('/account/sign-in');
    }
    next();
});







app.final((req, res, next) => {
    req.session?.save();
});