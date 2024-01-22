/* eslint-disable @typescript-eslint/no-explicit-any */
import { getJSON, JSONPath, saveJSON } from '../files.ts';
import { google } from 'npm:googleapis';
import { authenticate } from 'npm:@google-cloud/local-auth';
import { Scope } from './scopes.ts';

const loadSavedCredentials = async () => {
    const result = await getJSON<{
        client_secret: string;
        client_id: string;
        redirect_uris: string[];
        refresh_token: string;
        type: string;
    }>('credentials');
    if (result.isErr()) return null;
    return google.auth.fromJSON(result.value);
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
