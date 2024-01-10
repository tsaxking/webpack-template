import { getJSON, getJSONSync, JSONPath, saveJSON } from '../files.ts';
import { google } from 'npm:googleapis';
import { authenticate } from 'npm:@google-cloud/local-auth';
import { Scope } from './scopes.ts';

const loadSavedCredentials = async () => {
    return google.auth.fromJSON(await getJSON('credentials'));
};

const saveCredentials = async (credentials: any) => {
    saveJSON('credentials', credentials);
};

export const authorize = async (...scopes: Scope[]) => {
    let client: any = await loadSavedCredentials();
    if (client) return client;

    client = await authenticate({
        keyfilePath: JSONPath('credentials'),
        scopes: scopes.map((s) => `https://www.googleapis.com/auth/${s}`),
    });

    if (client.credentials) saveCredentials(client.credentials);

    return client;
};
