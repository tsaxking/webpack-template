import { getJSONSync, saveJSONSync } from "./files.ts";
import { google } from 'npm:googleapis';
import { authenticate } from 'npm:@google-cloud/local-auth';
import { DB } from "./databases.ts";
import { uuid } from "./uuid.ts";
import { JSONClient } from "../../../snap/deno/119/.cache/deno/npm/registry.npmjs.org/google-auth-library/9.0.0/build/src/auth/googleauth.d.ts";
import path from 'node:path';
import { __root } from "./env.ts";
import { JWTInput, OAuth2Client } from "../../../snap/deno/119/.cache/deno/npm/registry.npmjs.org/google-auth-library/9.0.0/build/src/index.d.ts";

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly'
];

const CREDENTIAL_PATH = path.resolve(__root, './storage/jsons/credentials.json');

const getClient = (id: string): JSONClient | null => {
    const c = DB.get('google/from-id', {
        id
    });

    return c ? google.auth.fromJSON(JSON.parse(c.token)) : null;
};

const saveClient = (id: string, credentials: OAuth2Client) => {
    const client: any = getJSONSync('credentials');
    const { client_secret, client_id, redirect_uris } = client.installed || client.web;

    const saved = {
        type: 'authorized_user',
        client_secret,
        client_id,
        redirect_uris,
        refresh_token: credentials.credentials.refresh_token
    };

    DB.run('google/new', {
        id,
        token: JSON.stringify(saved, null, 2),
        created: Date.now().toString()
    });
}

const authorize = async (id: string): Promise<OAuth2Client> => {
    let client: any = getClient(id);
    if (client) return client;
    const c = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIAL_PATH
    });
    if (c.credentials) {
        saveClient(id, c);
    }
    return c;
};

export const getCalendars = async (id: string): Promise<undefined | any[]> => {
    const account = DB.get('account/from-id', {
        id
    });

    if (account) {
        const auth = await authorize(id);
        if (!auth) return;
        const calendar = google.calendar({ version: 'v3', auth });
        const calendars = await calendar.calendarList.list();

        if (calendars.data.items) {
            calendars.data.items.forEach((cal) => {
                if (cal.id) {
                    const c = DB.get('calendars/from-google', {
                        googleId: cal.id
                    });
                    if (!c) {
                        DB.run('calendars/new', {
                            id: uuid(),
                            name: cal.summary || '',
                            accountId: id,
                            alias: uuid({
                                length: 32
                            }),
                            authenticated: 0,
                            googleId: cal.id
                        });
                    }
                }
            });

            return calendars.data.items;
        }
    }
}

type getEventResultError = {
    events: null;
    accountId: null;
    error: Error;
}

type getEventResultSuccess = {
    events: any[];
    accountId: string;
    error: null;
}

export const getEvents = async (calendarId: string, from: Date, to: Date): Promise<getEventResultError | getEventResultSuccess> => {
    const c = DB.get('calendars/from-google', {
        googleId: calendarId
    });

    if (!c) return {
        events: null,
        accountId: null,
        error: new Error('Calendar not found')
    };

    const auth = await authorize(c.accountId);

    const calendar = google.calendar({ version: 'v3', auth });
    const events = await calendar.events.list({
        calendarId,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    });

    return {
        events: events.data.items || [],
        accountId: c.accountId,
        error: null
    }
}