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


// app.static('/static', './dist');
// app.static('/uploads', './uploads');

app.get('/*/:param', (req, res, next) => {
    // console.log(req);
    console.log(req.params);

    res.send('Hello world');

    next();
});

app.get('/:param', (req, res, next) => {
    res.send('Testing...');
});


app.post('/test', (req, res, next) => {
    console.log(req);
});


// const handler = (req: Request) => {
//     console.log(req);
//     return new Response('Hello World');
// }


// Deno.serve({ port: 3000 }, handler);

// console.log(`Listening on ${domain}`);
