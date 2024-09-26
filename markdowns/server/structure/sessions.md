# Sessions

Sessions are a way to store data between requests. They are stored on the
server's database under Sessions and are identified by a unique ID. The session
ID is stored in a cookie on the client's browser called ssid.

## Initializing Sessions

To utilize sessions, you must have the database setup properly. Please ensure
that you run "deno task update" every time you pull from the repository.

To use the session class, it's super simple:

```typescript runnable
import { App } from './structure/app/app.ts';
import { Session } from './structure/session.ts';

const app = new App(3000, 'https://localhost:3000');

// this will ensure that the session is created and the cookie is setq
app.use(Session.middleware());
```

## Accounts

The user's account is accessible through their session object.

```typescript runnable
app.get('/', (req, res) => {
    const { account } = req.session;
    // account can be of type Account or null, depending on if the user is logged in
});

app.post('/sign-in', (req, res) => {
    // sign in logic, you must retrieve the account from the database before signing in
    req.session.signIn(account);
    req.session.signOut();
});
```

## Socket.io

You can emit events to the user's socket by using the session object.

```typescript runnable
app.get('/', (req, res) => {
    req.session.emit('event', { data: 'data' });
});
```
