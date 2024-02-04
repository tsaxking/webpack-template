/*
Turn SQL into a JSON object
SQL TYPE => TS TYPE

TEXT => string
INT => number
INTEGER => number
REAL => number
BLOB => string
NULL => null
VARCHAR => string
BOOLEAN => boolean
DATE => string
DATETIME => string
TIME => string
TIMESTAMP => string
DECIMAL => number
NUMERIC => number
FLOAT => number
DOUBLE => number
CHAR => string
SMALLINT => number
BIGINT => number
MEDIUMINT => number
*/

import { relative, resolve } from '../server/utilities/env.ts';
import { confirm } from './prompt.ts';

export const parseSql = async (queryDir: string, tableDir: string) => {
    type Primitive =
        | 'string'
        | 'number'
        | 'boolean'
        | 'null'
        | 'string | null'
        | 'number | null'
        | 'boolean | null';

    type Table = {
        [key: string]: Primitive;
    };

    const TABLE_NAME =
        /(CREATE(\s+)TABLE(\s+)IF(\s+)NOT(\s+)EXISTS|CREATE(\s+)TABLE|ALTER(\s+)TABLE|INSERT(\s+)INTO|UPDATE|DELETE(\s)FROM|DROP(\s+)TABLE|FROM)(\s+)(\w+)/i;
    const NUMBER = /INTEGER|INT|SMALLINT|MEDIUMINT|BIGINT/i;
    const STRING = /TEXT|VARCHAR|CHAR/i;
    const BOOLEAN = /BOOLEAN/i;
    const DATE = /DATE|DATETIME|TIME|TIMESTAMP/i;
    const DECIMAL = /DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL/i;
    const NOT_NULL = /NOT(\s+)NULL|PRIMARY(\s+)KEY|UNIQUE/i;
    const ADD_COLUMN = /ADD(\s+)COLUMN(\s+)(\w+)/;
    const DROP_COLUMN = /DROP(\s+)COLUMN(\s+)(\w+)/;
    const ALTER_COLUMN = /ALTER(\s+)COLUMN(\s+)(\w+)(\s+)(\w+)/;

    // gets all words that are between parentheses (not including the parentheses)
    const COLUMN_TYPE = /\(([^)]+)\)/;

    const ifNull = <T>(a: ArrayLike<T> | null): Array<T> => {
        if (a) return Array.from(a);
        return [];
    };

    const match = (
        str: string,
        regex: RegExp,
        pipe?: (s: string) => string,
    ): string[] => ifNull(str.match(regex)).map(pipe || ((s) => s));

    const translate = (type: string): string => {
        let t = 'string';

        if (NUMBER.test(type)) t = 'number';
        if (STRING.test(type)) t = 'string';
        if (BOOLEAN.test(type)) t = 'boolean';
        if (DATE.test(type)) t = 'string';
        if (DECIMAL.test(type)) t = 'number';

        const canBeNull = !NOT_NULL.test(type);
        if (canBeNull) t += ' | null';
        return t;
    };

    const tableName = (sql: string): string => lastMatch(sql.match(TABLE_NAME));
    const colName = (str: string) => str.trim().split(' ')[0];
    const colType = (str: string) => str.trim().split(' ').slice(1).join(' ');
    const generateTableFromCols = (cols: [string, Primitive][]) => {
        const table: Table = {};
        cols.forEach(([name, type]) => {
            table[name] = type as Primitive;
        });
        return table;
    };
    const removeComments = (sql: string): string => sql.replace(/--.*/g, '');

    const getColumns = (sql: string): [string, Primitive][] => {
        const match = sql.match(COLUMN_TYPE);
        const m = firstMatch(match);
        return m
            .replace(/\(|\)|\n/g, '') // remove parentheses
            .split(',')
            .map((s) => [colName(s), translate(colType(s))]) as [
                string,
                Primitive,
            ][];
    };

    const firstMatch = (match: RegExpMatchArray | null): string =>
        match ? match[0] : '';
    const lastMatch = (match: RegExpMatchArray | null): string =>
        match ? match[match.length - 1] : '';

    const isCreateTable = (sql: string): boolean => {
        return /CREATE(\s+)TABLE/.test(sql);
    };

    const createTable = (
        sql: string,
        tables: {
            [key: string]: Table;
        },
    ): {
        [key: string]: Table;
    } => {
        if (isCreateTable(sql)) {
            const name = tableName(sql);
            const columns = getColumns(sql);

            tables[name] = generateTableFromCols(columns);
        }

        return tables;
    };

    const getColFromAlter = (sql: string): [string, Primitive | 'drop'][] => {
        const add = match(sql, ADD_COLUMN);
        const drop = match(sql, DROP_COLUMN);
        const alter = match(sql, ALTER_COLUMN);

        const colChanges: [string, Primitive | 'drop'][] = [];

        // the matches column names are every other index, so we can use a flag to alternate between the two

        let i = false;
        for (const match of add) {
            const name = colName(match);
            const type = translate(colType(match));
            if (i) colChanges.push([name, type as Primitive]);
            i = !i;
        }

        i = false;
        for (const match of drop) {
            if (i) colChanges.push([match, 'drop']);
            i = !i;
        }

        i = false;
        for (const match of alter) {
            const name = colName(match);
            const type = translate(colType(match));
            if (i) colChanges.push([name, type as Primitive]);
            i = !i;
        }

        return colChanges;
    };

    const alter = (
        sql: string,
        tables: {
            [key: string]: Table;
        },
    ) => {
        const name = tableName(sql);
        const table = tables[name];
        if (!table) return tables;
        const cols = getColFromAlter(sql);

        for (const col of cols) {
            const [name, type] = col;
            if (type === 'drop') {
                delete table[name];
            } else {
                table[name] = type;
            }
        }

        return tables;
    };

    const parseTableSql = (sql: string) => {
        sql = removeComments(sql);

        // split the sql into individual statements
        // keep in mind, subqueries can have semicolons, so we need to be careful
        // split by semicolons that are not inside parentheses
        const statements = sql.split(/;(?![^()]*\))/);

        let tables: {
            [key: string]: Table;
        } = {};

        for (const s of statements) {
            tables = createTable(s, tables);
            tables = alter(s, tables);
        }

        return tables;
    };

    const _pullVersions = (): {
        [key: string]: Table;
    } => {
        const init = Deno.readTextFileSync('storage/db/queries/db/init.sql');
        const versions = Deno.readDirSync('storage/db/queries/db/versions');

        let sql = init;
        for (const v of versions) {
            sql += Deno.readTextFileSync(
                `storage/db/queries/db/versions/${v.name}`,
            );
        }

        return parseTableSql(sql);
    };

    const convertToTs = (tables: { [key: string]: Table }) => {
        let ts = '';
        for (const [name, table] of Object.entries(tables)) {
            ts += `export type ${name} = {\n`;
            for (const [col, type] of Object.entries(table)) {
                if (!col) continue;
                ts += `    ${col}: ${type};\n`;
            }
            ts += '};\n\n';
        }
        return ts;
    };

    const parseExecQuery = (
        sql: string,
        tables: {
            [key: string]: Table;
        },
        queryName: string,
    ): [string, string | undefined, string, string | undefined] | undefined => {
        if (sql.includes('INNER JOIN')) {
            console.log('INNER JOIN not supported: ', queryName);
            // TODO: add support for INNER JOIN
            return undefined;
        }

        // converts insert, update, delete, and select statements into typescript
        // for example:
        // INSERT INTO Users (id, name, email) VALUES (:id, :name, :email);
        // becomes:
        // type InsertUsers = {
        //     id: number;
        //     name: string;
        //     email: string;
        // }

        // SELECT * FROM Users WHERE id = :id;
        // becomes:
        // type SelectUsers = {
        //     id: number;
        // }
        // and the return type would be an array of Users

        // UPDATE Users SET name = :name WHERE id = :id;
        // becomes:
        // type UpdateUsers = {
        //     name: string;
        //     id: number;
        // }

        // DELETE FROM Users WHERE id = :id;
        // becomes:
        // type DeleteUsers = {
        //     id: number;
        // }

        // this is useful for creating types for the parameters of the query
        // and for the return type of the query
        try {
            sql = removeComments(sql);
            const ins = /INSERT(\s+)INTO/i;
            const upd = /UPDATE/i;
            const del = /DELETE(\s+)FROM/i;
            const sel = /SELECT/i;
            // const ijn = /INNER(\s+)JOIN/i;

            const isInsert = ins.test(sql);
            const isUpdate = upd.test(sql);
            const isDel = del.test(sql);
            const isSelect = sel.test(sql);
            // const isIjn = ijn.test(sql);

            if (isInsert) {
                const name = tableName(sql);
                const table = tables[name];
                const cols = getColumns(sql);
                let ts = `export type Insert_${queryName} = {\n`;
                for (const [col] of cols) {
                    const type = table[col];
                    ts += `    ${col}: ${type};\n`;
                }
                ts += '};';

                return [ts, undefined, `Insert_${queryName}`, undefined];
            }

            if (isUpdate) {
                const name = tableName(sql);
                const table = tables[name];

                // get everything immediately before an equals sign
                // get everything immediately after an equals sign
                const before = /(\w+)(\s*)=/g;
                const after = /=(\s*)([\w:$"']+)/g;

                const beforeMatch = match(sql, before).map((s) =>
                    s.replace(/=|\s/g, '')
                );
                const afterMatch = match(sql, after).map((s) =>
                    s.replace(/=|\s/g, '')
                );

                let ts = `\nexport type Update_${queryName} = `;
                const _ts = ts;

                let usesVars = false,
                    uses$ = false;

                const $data: Primitive[] = [];
                let j = 0;
                for (let i = 0; i < beforeMatch.length; i++) {
                    const col = beforeMatch[i];
                    const data = afterMatch[i];

                    // if the data is a variable, we can use the type of the variable, and add {\n to the first line
                    // if the data starts with $, we must use an array
                    // if it starts with neither, we ignore it as it's a constant
                    if (data.startsWith(':')) {
                        if (j === 0) ts += '{\n';
                        usesVars = true;
                        if (uses$) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        if (!col) continue;
                        ts += `    ${col}: ${table[col]};\n`;
                        j++;
                    } else if (data.startsWith('$')) {
                        if (j === 0) ts += '[ ';
                        if (usesVars) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        uses$ = true;

                        const $num = Number(data.replace('$', ''));
                        if (isNaN($num)) throw new Error('Invalid $ variable');
                        $data[$num - 1] = table[col];
                        j++;
                    }
                }

                if ($data.length) {
                    // uses $ variables
                    ts += $data.join(', ');
                    ts += ' ];';
                } else {
                    if (ts === _ts) ts += '{';
                    ts += '};';
                }

                return [ts, undefined, `Update_${queryName}`, undefined];
            }

            if (isDel) {
                // use the same method as update
                const name = tableName(sql);
                const table = tables[name];

                const before = /(\w+)(\s*)=/g;
                const after = /=(\s*)([\w:$"']+)/g;

                const beforeMatch = match(sql, before).map((s) =>
                    s.replace(/=|\s/g, '')
                );
                const afterMatch = match(sql, after).map((s) =>
                    s.replace(/=|\s/g, '')
                );

                let ts = `\nexport type Delete_${queryName} = `;
                const _ts = ts;

                let usesVars = false,
                    uses$ = false;

                const $data: Primitive[] = [];

                let j = 0;
                for (let i = 0; i < beforeMatch.length; i++) {
                    const col = beforeMatch[i];
                    const data = afterMatch[i];

                    if (data.startsWith(':')) {
                        if (j === 0) ts += '{\n';
                        usesVars = true;
                        if (uses$) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        if (!col) continue;
                        ts += `    ${col}: ${table[col]};\n`;
                        j++;
                    } else if (data.startsWith('$')) {
                        if (j === 0) ts += '[ ';
                        if (usesVars) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        uses$ = true;

                        const $num = Number(data.replace('$', ''));
                        if (isNaN($num)) throw new Error('Invalid $ variable');
                        $data[$num - 1] = table[col];
                        j++;
                    }
                }

                if ($data.length) {
                    ts += $data.join(', ');
                    ts += ' ];';
                } else {
                    if (ts === _ts) ts += '{';
                    ts += '};';
                }

                return [ts, undefined, `Delete_${queryName}`, undefined];
            }

            if (isSelect) {
                // use the same method as update
                const name = tableName(sql);
                const table = tables[name];

                const before = /(\w+)(\s*)=/g;
                const after = /=(\s*)([\w:$"']+)/g;

                const beforeMatch = match(sql, before).map((s) =>
                    s.replace(/=|\s/g, '')
                );
                const afterMatch = match(sql, after).map((s) =>
                    s.replace(/=|\s/g, '')
                );

                let ts = `\nexport type Select_${queryName} = `;
                const _ts = ts;
                let usesVars = false,
                    uses$ = false;

                const $data: Primitive[] = [];

                let j = 0;
                for (let i = 0; i < beforeMatch.length; i++) {
                    const col = beforeMatch[i];
                    const data = afterMatch[i];
                    if (data.startsWith(':')) {
                        if (j === 0) ts += '{\n';
                        usesVars = true;
                        if (uses$) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        if (!col) continue;
                        ts += `    ${col}: ${table[col]};\n`;
                        j++;
                    } else if (data.startsWith('$')) {
                        if (j === 0) ts += '[ ';
                        if (usesVars) {
                            throw new Error(
                                'Cannot use both $ and : in the same query',
                            );
                        }
                        uses$ = true;

                        const $num = Number(data.replace('$', ''));
                        if (isNaN($num)) throw new Error('Invalid $ variable');
                        $data[$num - 1] = table[col];
                        j++;
                    }
                }

                if ($data.length) {
                    ts += $data.join(', ');
                    ts += ' ];';
                } else {
                    if (ts === _ts) ts += '{';
                    ts += '};';
                }

                const betweenSelectAndFrom =
                    /SELECT(\s+)([\w*.\s,]+)(\s+)FROM/i;

                let returnMatch = firstMatch(sql.match(betweenSelectAndFrom));
                returnMatch = returnMatch.replace(/SELECT|FROM|\s/g, '');
                const returns = returnMatch.split(',');
                let returnTs = `\nexport type Return_${queryName} = {\n`;
                if (returns[0] === '*') {
                    for (const [col, type] of Object.entries(table)) {
                        if (!col) continue;
                        returnTs += `    ${col}: ${type};\n`;
                    }
                    returnTs += '};';

                    return [
                        ts,
                        returnTs,
                        `Select_${queryName}`,
                        `Return_${queryName}`,
                    ];
                }
                for (const r of returns) {
                    if (!r) continue;
                    returnTs += `    ${r}: ${table[r]};\n`;
                }
                returnTs += '};';

                return [
                    ts,
                    returnTs,
                    `Select_${queryName}`,
                    `Return_${queryName}`,
                ];
            }
        } catch {
            return undefined; // probably is using some inner join or something
        }
    };

    // const str = parseExecQuery(
    //     `
    //         SELECT * FROM Users WHERE id = :id;
    //     `,
    //     parseTableSql(testSql),
    //     'SelectUsers',
    // );

    const queries: [string, string][] = [];
    const recurse = (dir: string) => {
        const entries = Deno.readDirSync(dir);
        for (const entry of entries) {
            if (entry.isFile) {
                const sql = Deno.readTextFileSync(`${dir}/${entry.name}`);
                queries.push([
                    removeComments(sql),
                    relative('storage/db/queries', dir + '/' + entry.name),
                ]);
            }
            if (entry.isDirectory) {
                // if (entry.name === 'versions') continue;
                recurse(`${dir}/${entry.name}`);
            }
        }
    };

    recurse('storage/db/queries');
    const makeTSFriendly = (name: string) => {
        return name.replace(/[-0-9/\\]/g, '_');
    };

    const tables = parseTableSql(queries.map((q) => q[0]).join('\n\n'));

    // console.log(tables);

    let allTypes = convertToTs(tables);
    let importTs = '';
    let queryTs = '';
    allTypes += '\n\n// Queries\n\n';

    let num = 0;

    const doesExist = (num: number) => {
        try {
            Deno.statSync(
                resolve(queryDir, num ? `queries-${num}.ts` : 'queries.ts'),
            );
            return true;
        } catch {
            return false;
        }
    };

    while (doesExist(num)) {
        num++;
    }

    const queriesName = num ? `./queries-${num}.ts` : './queries.ts';
    const tablesName = num ? `./tables-${num}.ts` : './tables.ts';

    if (num) {
        const res = await confirm(
            'It looks like you have multiple queries files. Would you like to create a new one? (this will not delete the old ones, just create a new one with an incremented number at the end of the name)',
        );
        if (!res) {
            console.log('Aborting...');
            Deno.exit();
        }
    }

    for (const query of queries) {
        const name = makeTSFriendly(query[1].replace('.sql', ''));
        const parsed = parseExecQuery(query[0], tables, name);
        if (parsed) {
            const [exec, ret, execName, retName] = parsed;
            if (retName) {
                importTs += `import { ${execName}, ${retName} } from '${
                    relative(
                        resolve(queryDir, queriesName),
                        resolve(tableDir, tablesName),
                    ).slice(1)
                }';\n`;
            } else {
                importTs += `import { ${execName} } from '${
                    relative(
                        resolve(queryDir, queriesName),
                        resolve(tableDir, tablesName),
                    ).slice(1)
                }';\n`;
            }
            allTypes += exec;
            queryTs += `
            '${query[1].replace('.sql', '')}': [
                [
                    ${execName}
                ],
                ${retName ? retName : 'unknown'}
            ]
        `;
            if (ret) allTypes += ret;
        }

        allTypes += '\n\n';
    }

    allTypes = allTypes.replace(/{}/g, 'undefined');

    Deno.writeTextFileSync(
        resolve(tableDir, tablesName),
        `// This file was generated by a script, please do not modify it. If you see any problems, please raise an issue on https://github.com/tsaxking/webpack-template/issues\n\n// TABLES:\n\n` +
            allTypes,
    );
    Deno.writeTextFileSync(
        resolve(queryDir, queriesName),
        '// This file was generated by a script, please do not modify it. If you see any problems, please raise an issue on https://github.com/tsaxking/webpack-template/issues\n\n' +
            importTs +
            '\n\nexport type Queries = {\n' +
            queryTs +
            '\n};',
    );
};
