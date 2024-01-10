import { authorize } from './google.ts';
import { google } from 'npm:googleapis';

const sheetAuth = async () => {
    return google.sheets({
        version: 'v4',
        auth: await authorize('spreadsheets', 'drive'),
    });
};

export const getSheetDataRange = (
    sheet: string,
    rows: number,
    cols: number,
) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // turn cols into A => Z, AA => ZZ, etc
    let col = '';
    while (cols > 0) {
        col = alphabet[(cols - 1) % alphabet.length] + col;
        cols = Math.floor((cols - 1) / alphabet.length);
    }

    return `${sheet}!A1:${col}${rows}`;
};

export const upload = async (ssid: string, sheet: string, data: string[][]) => {
    const auth = await authorize('spreadsheets', 'drive');

    const sheets = google.sheets({ version: 'v4', auth });

    return sheets.spreadsheets.values.update({
        spreadsheetId: ssid,
        range: getSheetDataRange(
            sheet,
            data.length,
            Math.max(...data.map((d) => d.length)),
        ),
        valueInputOption: 'RAW',
        requestBody: {
            values: data,
        },
    });
};

export const clear = async (ssid: string, sheet: string) => {
    const sheets = await sheetAuth();

    return sheets.spreadsheets.values.clear({
        spreadsheetId: ssid,
        range: sheet,
    });
};

export const retrieve = async (
    ssid: string,
    sheet: string,
    rows: number,
    cols: number,
) => {
    const sheets = await sheetAuth();

    return sheets.spreadsheets.values.get({
        spreadsheetId: ssid,
        range: getSheetDataRange(sheet, rows, cols),
    });
};

export const makeSheet = async (ssid: string, sheet: string) => {
    const sheets = await sheetAuth();

    const s = await sheets.spreadsheets.get({
        spreadsheetId: ssid,
    });

    const sheetExists = s.data.sheets?.some((s) =>
        s.properties?.title === sheet
    );

    if (sheetExists) return;

    return sheets.spreadsheets.batchUpdate({
        spreadsheetId: ssid,
        requestBody: {
            requests: [{
                addSheet: {
                    properties: {
                        title: sheet,
                    },
                },
            }],
        },
    });
};

export const deleteSheet = async (ssid: string, sheet: string) => {
    const sheets = await sheetAuth();

    return sheets.spreadsheets.batchUpdate({
        spreadsheetId: ssid,
        requestBody: {
            requests: [{
                deleteSheet: {
                    sheetId: (await sheets.spreadsheets.get({
                        spreadsheetId: ssid,
                    })).data.sheets?.find((s) => s.properties?.title === sheet)
                        ?.properties?.sheetId,
                },
            }],
        },
    });
};
