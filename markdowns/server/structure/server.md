# Deno server

This is a simple server that runs Deno's
[example](https://deno.land/std/http/file_server.ts) file server, but handles
for the end user like express.js.

## Initialization

```typescript runnable
// assuming this is /server/server.ts
import { App } from './structure/app/app.ts';

// no need to do app.listen() because it's done in the constructor
const app = new App(
    3000, // port
    'https://localhost:3000', // domain
    // VV this is optional VV
    {
        ioPort: 3001, // socket
    },
);

// looks just like express.js!
app.get('/home', (req, res) => {
    res.send('Hello world!');
});

// redirecting
app.get('/', (req, res) => {
    res.redirect('/home');
});

// sending a file
app.get('/test', (req, res) => {
    res.sendFile('./test.html');
});

// post request with a strongly typed body (the generic is optional, it will default to unknown)
app.post<{ info: string }>('/some-post-request', (req, res, next) => {
    console.log(req.body.info); // you can use generics to define the body type
    res.status(200).json({ success: true });
});
```

## Routing

Expand and organize your routes with the `Route` class. my-route.ts

```typescript runnable
import { Route } from './structure/route/route.ts';

const router = new Route(); // nothing needs to be passed in

router.post('/some-post-request', (req, res, next) => {
    res.json({ success: true });
});

export default router;
```

server.ts

```typescript runnable
import { App } from './structure/app/app.ts';
// I recommend you name your routes the same as the file name
import router as someRoute from './my-route.ts';

const app = new App(3000, 'https://localhost:3000');

app.route('/some-route', router);
```

## Static files

Send any file from a directory to the client. Handles similar to express.js.

```typescript runnable
import { resolve } from './utilities/env.ts';

app.static('/some-directory', resolve('../path/to/directory'));
```

## Middleware

Middleware is handled the same as express.js.

```typescript runnable
const app = new App(3000, 'https://localhost:3000');

const myFn = (req, res, next) => {
    console.log('This is middleware!');
    next();
};

// run only on this post request
app.post('/request', myFn, (req, res, next) => {
    res.json({ success: true });
});

// run on all requests that start with /test
app.use('/test' myFn);
// run on all requests
app.use(myFn);
app.use('/*', myFn); // same as above
// run on all post requests
app.post(myFn);
```

## Parameters

Parameters are handled the same as express.js.

```typescript runnable
app.get('/user/:id', (req, res, next) => {
    console.log(req.params.id); // 123
    res.send('Success!');
});
```

## Error handling

### Throwing errors

Error handling is NOT like express.js. In express, if there was an error in any
middleware or route, it would crash the whole server. Now, if there is a
problem, it will just send a 500 error to the client, log the error, and
continue running.

```typescript runnable
app.get('/user/:id', (req, res, next) => {
    throw new Error('This is an error!'); // will run res.sendStatus('unknown:error');
    res.send('Success!'); // will not happen
});
```

### "Headers already sent" (sending a response twice)

One thing I've really disliked about express.js is the poor error logging. If
you send 2+ responses to a single request, it will log "headers already sent".
Luckily, it doesn't crash the server, however, that error message is just
annoying. You want to know where the first response was sent, not that there
were two responses... This is why I've added a little feature that will just log
if the response was already resolved. It will not crash the server, it will just
log the error and continue running. Same thing if there was not a response,
it'll just tell you that there wasn't a response, rather than just letting the
request hang out all alone. This is a lot more helpful than the default
express.js error logging.

```typescript runnable
app.get('/user/:id', (req, res, next) => {
    res.send('Success!');
    res.send('This will not be sent!'); // will log "headers already sent"
});

app.get('/user/:id', (req, res, next) => {
    // will log `Request {req.method}: {req.pathname} was not resolved and did not call next() at {file path}`
});
```

## Socket.io

I'm still working on making this nice for the end user, but the socket is
through the sessions object. Also, because of the possibility of data-leaks due
to too many listeners on the server, and they're not really that useful because
you can just use a request, I've decided to not yet implement socket listeners.

To emit to the client, just pull the session, and call `emit()`. It's that
simple!

```typescript runnable
app.post('/some-post-request', (req, res, next) => {
    // emit only to the client that made the request
    // this is good for sending data to the client after the response has been sent
    req.session.emit('some-event', { success: true });

    // emit to all clients
    app.io.emit('some-event', { success: true });

    res.json({ success: true });
});
```

## Expanded features from Express.js

I like express.js, but there were a few things I thought were missing. So I
added them to this server :)

### Finally

Run a function after every request (including all routes). This is good for
logging requests to a csv, handling no response (404), etc.

The template repository has an example of how to log requests to a csv file.

```typescript runnable
app.get('/user/:id', (req, res, next) => {
    res.send('Success!');
});

app.final((req, res, next) => {
    console.log('This will run after every request!');
});
```

### Streams

Sending a stream of data to the client

```typescript runnable
app.post('/some-stream', (req, res, next) => {
    res.stream(data.map((d) => JSON.stringify(d))); // must be an array of strings
});
```

### Render

Render a template with data. This is good for sending dynamic html files to the
client. This uses node-html-constructor. It's similar to ejs, but I absolutely
hate the syntax for ejs, so I made my own. It's a lot more simple and easy to
use imho ;)

```typescript runnable
import { DB } from './structure/databases.ts';

app.get('/my-account/:id', (req, res) => {
    const { id } = req.params;
    const data = DB.get<Account>('account/id', { id }); // could return email, name, etc.
    res.render('./templates/my-account.html', data); // replaces all {{ key }} with data[key]
});
```

### File uploads

Uploads are SO much easier than express's method. You have to install multer,
make some weird middleware function that is confusing, do some other stuff
that's obscure to a beginner, etc. It's just a mess. So I made it a lot easier.
Just `import { fileUpload } from './utilities/stream.ts';`, and use it! This
will generate a random file name, save it to ./uploads/{filename}.{ext} and
insert the information of the file into the request object.

```typescript runnable
import { fileUpload } from './utilities/stream.ts';

app.post('/save-profile-picture', fileUpload(), (req, res, next) => {
    const { files } = req;
    console.log(files); // ({ name: string, id: string, ext: string, size: number (in bytes) })[]
});

// or if you want to add some options
app.post(
    '/save-profile-picture',
    fileUpload({
        // each of these are optional
        maxFileSize: 1000000, // 1mb
        maxFiles: 1, // 1 file
        allowedExtensions: ['png', 'jpg', 'jpeg', 'gif'], // allows only these extensions
    }),
    (req, res, next) => {
        const { files } = req;
        console.log(files); // ({ name: string, id: string, ext: string, size: number (in bytes) })[]
    },
);
```
