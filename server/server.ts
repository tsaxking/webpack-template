import env, { __root } from "./utilities/env.ts";
import { log } from "./utilities/terminal-logging.ts";
import { App } from "./structure/app.ts";
import { Req, Res, Next, ServerFunction } from "./structure/app.ts";
import { Session } from "./structure/sessions.ts";
import * as path from 'node:path';
import { emailValidation } from './middleware/spam-detection.ts';
import { getJSON, getJSONSync, getTemplate, log as serverLog } from "./utilities/files.ts";
import { Status } from "./utilities/status.ts";
import { homeBuilder, navBuilder } from "./utilities/page-builder.ts";
import Account from "./structure/accounts.ts";

const port = +env.PORT || 3000;
const domain = env.DOMAIN || `http://localhost:${port}`;


const app = new App(port, domain, {
    // onListen: () => {
        // log(`Listening on ${domain}`);
    // },
    // onConnection: (socket) => {
        // log('New connection:', socket.id);
    // },
    ioPort: port + 1
});


app.use('/*', (req, res, next) => {
    log(`[${req.method}] ${req.url}`);
    next();
});


app.static('/public', path.resolve(__root, './public'));
app.static('/dist', path.resolve(__root, './dist'));
app.static('/uploads', path.resolve(__root, './uploads'));


app.use('/*', Session.middleware());






app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/logo-square.png'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(__root, './public/pictures/robots.jpg'));
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

app.get('/test/:page', (req, res, next) => {
    if (env.ENVIRONMENT !== 'dev') return next();
    res.sendTemplate('entries/test/' + req.params.page);
});


app.use('/*', Account.autoSignIn(env.AUTO_SIGN_IN));

app.get('/*', (req, res, next) => {
    if (!req.session?.accountId) {
        req.session!.prevUrl = req.url;
        return res.redirect('/account/sign-in');
    }

    next();
});




app.get('/home', (req, res, next) => {
    res.sendTemplate('index');
});



// routing

import { router as admin } from './routes/admin.ts';
import { router as account } from './routes/account.ts';

app.route('/admin', admin);
app.route('/account', account);



















type Link = {
    name: string;
    html: string;
    icon: string;
    pathname: string;
    scripts: string[];
    styles: string[];
    keywords: string[];
    description: string;
    screenInfo: {
        size: string;
        color: string
    };
    prefix: string;
    display: boolean;
    permission?: string;
};

type Page = {
    name: string;
    links: Link[];
    display: boolean;
};


const getBlankTemplate = (page: string): ServerFunction => {
    return async (req: Req, res: Res, _next: Next) => {
        const { page: _requestedPage } = req.params;

        // const permissions = await req.session.account?.getPermissions();

        // if (permissions?.permissions.includes('logs')) {
        //     req.session.getSocket(req)?.join('logs');
        // }


        const pages = await getJSON('pages/' + page) as Page[];

        // const links = pages.map(p => p.links).some(linkList => linkList.some(l =>  l.pathname === req.originalUrl));

        // if (!links) return res.redirect(`/${page}` + pages[0].links[0].pathname);

        const cstr = {
            pages: (await Promise.all(pages.map(async p => {
                return Promise.all(p.links.map(async l => {
                    if (l.display === false) return;
                    return {
                        title: l.name,
                        content: await getTemplate(`dashboards/${page}/` + l.html),
                        lowercaseTitle: l.name.toLowerCase().replace(/ /g, '-'),
                        prefix: l.prefix,
                        year: new Date().getFullYear()
                    }
                }))
            }))).flat(Infinity).filter(Boolean),


            navSections: pages.flatMap(page => {
                return [
                    {
                        navScript: {
                            title: page.name,
                            type: 'navTitle'
                        }
                    },
                    ...page.links.map(l => {
                        if (l.display === false) return;
                        return {
                            navScript: {
                                name: l.name,
                                type: 'navLink',
                                pathname: l.pathname,
                                icon: l.icon,
                                lowercaseTitle: l.name.toLowerCase().replace(/ /g, '-'),
                                prefix: l.prefix
                            }
                        }
                    })
                ];
            }).flat(Infinity).filter(Boolean),


            description: 'sfzMusic Dashboard',
            keywords: 'sfzMusic, Dashboard',
            offcanvas: true,
            navbar: await navBuilder(req.url, true),
            year: new Date().getFullYear(),
            script: await getTemplate('dashboards/' + page + '/script'),
        };

        const html = await getTemplate('dashboard-index', cstr);
        res.status(200).send(html);
    };
};



// app.get('/member/:page', Account.isSignedIn, Member.isMember, getBlankTemplate('member'));
// app.get('/instructor/:page', Account.isSignedIn, getBlankTemplate('instructor'));
// app.get('/admin/:page', Role.allowRoles('admin'), getBlankTemplate('admin'));
// app.get('/student/:page', Account.isSignedIn, getBlankTemplate('student'));
// app.get('/library/:page', Account.isSignedIn, getBlankTemplate('library'));
























type Log = {
    date: number,
    duration: number,
    ip?: string|null,
    method: string,
    url: string,
    status?: number,
    userAgent?: string,
    body: string,
    params: string,
    query: string
}







app.final((req, res, next) => {
    log('Final function');

    if (!res.fulfilled) {
        return res.sendStatus('not-found');
    }


    // req.session.save();
    const csvObj: Log = {
        date: Date.now(),
        duration: Date.now() - req.start,
        ip: req.session?.ip,
        method: req.method,
        url: req.url,
        status: res._status,
        userAgent: req.headers.get('user-agent') || '',
        body: req.method == 'post' ? JSON.stringify((() => {
            let { body } = req;
            body = JSON.parse(JSON.stringify(body));
            delete body.password;
            delete body.confirmPassword;
            delete body.files;
            return body;
        })()) : '',
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query)
    };

    serverLog('request', csvObj);
});





// const handler = (req: Request): Response => {
//     return new Response('Hello World!');
// }

// Deno.serve({ port: 3000 }, handler);