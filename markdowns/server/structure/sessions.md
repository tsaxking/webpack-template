# Sessions
Sessions are a way to store data between requests. They are stored on the server's database under Sessions and are identified by a unique ID. The session ID is stored in a cookie on the client's browser called ssid.

## Utilizing Sessions
To utilize sessions, you must have the database setup properly. Please ensure that you run "deno task update" every time you pull from the repository.

To use the session class, it's super simple:
```typescript runnable
import { App } from './structure/app/app.ts';
import { Session } from './structure/session.ts';

const app = new App(3000, 'https://localhost:3000');

// this will ensure that the session is created and the cookie is setq  
app.use(Session.middleware());
```