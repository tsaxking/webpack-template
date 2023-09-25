import env, { __root } from "./utilities/env.ts";
import { log } from "./utilities/terminal-logging.ts";
import { App } from "./structure/app.ts";
import { Req, Res, Next, ServerFunction } from "./structure/app.ts";
import { Session } from "./structure/sessions.ts";
import * as path from 'node:path';
import { emailValidation } from './middleware/spam-detection.ts';
import { getJSON, getJSONSync, getTemplate } from "./utilities/files.ts";
import { Status } from "./utilities/status.ts";
import { homeBuilder, navBuilder } from "./utilities/page-builder.ts";
import Account from "./structure/accounts.ts";



const port = +env.PORT || 3000;
const domain = env.DOMAIN || `http://localhost:${port}`;

const app = new App(port, domain, {
    onListen: () => {
        log(`Listening on ${domain}`);
    }
});


app.get('/home/:path', (req, res, next) => {
    log(req.params);
});