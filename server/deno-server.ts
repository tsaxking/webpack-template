import env from "./utilities/env.ts";
import { log } from "./utilities/terminal-logging.ts";
import { App } from "./structure/app.ts";



const port = +env.PORT || 3000;
const domain = env.DOMAIN || `http://localhost:${port}`;

const app = new App(port, domain, {
    onListen: () => {
        log(`Listening on ${domain}`);
    }
});


app.static('/static', './dist');
app.static('/uploads', './uploads');

app.get('/*/:param', (req) => {
    return req.params.param;
});


app.post('/test', (req) => {
    return req.content;
});