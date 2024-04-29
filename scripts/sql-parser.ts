import { copyNoRef } from "../shared/copy";
import { capitalize } from "../shared/text";

type Primitive =
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'string'
    | 'number'
    | 'boolean'
    | 'bigint'
    | 'unknown';

type SQLType = 
    'insert' | 
    'update' | 
    'create-table' | 
    'delete' | 
    'drop-table' | 
    'select' | 
    'alter-table';

type ColType = {
    input: string;
    type: Primitive;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    autoIncrement: boolean;
    foreignKey: string;
    serial: boolean;
}

type Table = {
    name: string;
    columns: {
        [key: string]: ColType;
    };
}

type ExecQuery = {
    type: SQLType;
    input: {
        [key: string]: Primitive;
    },
    output: {
        [key: string]: Primitive;
    }
}

export const isValidSQL = (sql: string): boolean => {
    if (numStatements(sql) > 1) return false; // Only one statement allowed
    if (sql.includes(':') && sql.includes('$')) return false; // no named and positional parameters
    return true;
}

export const splitSQL = (string: string): string[] => {
    return removeComments(string).split(';').map((s) => s.trim()).filter((s) => s.length > 0);
}

export const tableName = (sql: string): string => {
    const name = sql.match(/(CREATE(\s*)TABLE(\s*)IF(\s*)NOT(\s*)EXISTS|CREATE(\s*)TABLE|ALTER(\s*)TABLE|INSERT(\s*)INTO|UPDATE|DELETE(\s)FROM|DROP(\s*)TABLE|FROM)(\s*)(\w+)/i);
    if (!name) throw new Error('Table name not found');
    return name[12];
}

export const numStatements = (sql: string): number => sql.split(';').length - 1;

export const removeComments = (sql: string): string => {
    return sql.replace(/--.*\n/g, '');
}

export const getPrimitive = (col: string): Primitive => {
    const has = col.includes.bind(col);
    if (has('VARCHAR')) return 'string';
    if (has('BOOL')) return 'boolean';
    if (has('NULL')) return 'null';
    if (has('SERIAL')) return 'number';
    if (has('TEXT')) return 'string';
    if (has('BIGINT')) return 'bigint';
    if (has('INT')) return 'number';
    if (has('BOOLEAN')) return 'boolean';
    if (has('REAL')) return 'number';
    if (has('FLOAT')) return 'number';
    if (has('DOUBLE')) return 'number';
    if (has('DECIMAL')) return 'number';
    if (has('DATE')) return 'string';
    if (has('TIME')) return 'string';
    if (has('TIMESTAMP')) return 'string';
    if (has('BINARY')) return 'string';
    if (has('BLOB')) return 'string';
    if (has('JSON')) return 'string';
    if (has('UUID')) return 'string';
    if (has('ENUM')) return 'string';
    if (has('SET')) return 'string';
    if (has('GEOMETRY')) return 'string';
    if (has('POINT')) return 'string';
    if (has('MONEY')) return 'string';
    if (has('CHAR')) return 'string';
    if (has('TINYINT')) return 'number';
    if (has('SMALLINT')) return 'number';
    if (has('MEDIUMINT')) return 'number';
    return 'unknown';
}

export const getColumnType = (col: string): ColType => {
    return {
        input: col,
        type: getPrimitive(col),
        nullable: !col.includes('NOT NULL'),
        primaryKey: col.includes('PRIMARY KEY'),
        unique: col.includes('UNIQUE'),
        autoIncrement: col.includes('AUTOINCREMENT'),
        foreignKey: '',
        serial: col.includes('SERIAL')
    }
}

export const parseTable = (sql: string): Table => {
    if (numStatements(sql) > 1) throw new Error('Only one SQL statement is allowed');
    const output: Table = {
        name: '',
        columns: {}
    };

    output.name = tableName(sql);

    const columns = sql.match(/\((\s*)((.|\n)*)(\s*)\)/i);
    if (!columns) throw new Error('Columns not found, this may not be a CREATE TABLE statement');
    const cols = columns[2].split(',');
    for (const col of cols) {
        const [name,] = col.trim().split(/\s+/);
        output.columns[name] = getColumnType(col.trim());
    }

    return output;
}

export const sqlType = (value: string): SQLType | undefined => {
    if (value.includes('INSERT INTO')) return 'insert';
    if (value.includes('UPDATE')) return 'update';
    if (value.includes('CREATE TABLE')) return 'create-table';
    if (value.includes('DELETE')) return 'delete';
    if (value.includes('DROP TABLE')) return 'drop-table';
    if (value.includes('SELECT')) return 'select';
    if (value.includes('ALTER TABLE')) return 'alter-table';
    return undefined;
}

export const alterTable = (sql: string, table: Table): Table => {
    if (sqlType(sql) !== 'alter-table') throw new Error('This is not an ALTER TABLE statement');
    
    const name = tableName(sql);
    if (name !== table.name) throw new Error('Table name does not match');
    
    const output = copyNoRef<Table>(table);

    if (sql.includes('ADD COLUMN')) {
        const col = sql.match(/ADD COLUMN(\s*)(\w+)(\s*)(\w+)/i);
        if (!col) throw new Error('Column name not found');
        output.columns[col[2]] = getColumnType(col[4]);
    }

    if (sql.includes('DROP COLUMN')) {
        const col = sql.match(/DROP COLUMN(\s*)(\w+)/i);
        if (!col) throw new Error('Column name not found');
        delete output.columns[col[2]];
    }

    if (sql.includes('ALTER COLUMN')) {
        const col = sql.match(/ALTER COLUMN(\s*)(\w+)(\s*)(\w+)/i);
        if (!col) throw new Error('Column name not found');
        output.columns[col[2]] = getColumnType(col[4]);
    }

    if (sql.includes('RENAME COLUMN')) {
        const col = sql.match(/RENAME COLUMN(\s*).+/i);
        if (!col) throw new Error('Column name not found');
        const [oldName, ,newName] = col[0].split(/\s+/).slice(2);
        output.columns[newName] = output.columns[oldName];
        delete output.columns[oldName];
    }

    return output;
};

export const tableToTS = (table: Table): string => {
    const columns = Object.entries(table.columns).map(([key, value]) => {
        return `${key}: ${value.type};`;
    }).join('\n    ');

    return `select type ${table.name} = {
    ${columns}
}`;
};

export const execQueryToTS = (query: ExecQuery, name: string): string => {
    const input = Object.entries(query.input).map(([key, value]) => {
        return `${key}: ${value};`;
    }).join('\n    ');
    const output = Object.entries(query.output).map(([key, value]) => {
        return `${key}: ${value};`;
    }).join('\n    ');

    return `
export type ${capitalize(query.type)}_${capitalize(name)}_Input = {
    ${input}
}
export type ${capitalize(query.type)}_${capitalize(name)}_Output = {
    ${output}
}`;
}

export const getPrimaryKey = (table: Table): string | undefined => {
    for (const [key, value] of Object.entries(table.columns)) {
        if (value.primaryKey) return key;
    }
    return undefined;
}

export const buildDefaultQueries = (table: Table): {
    insert: string;
    update: string;
    delete: string;
    select: string;
} => {
    const primaryKey = getPrimaryKey(table);
    if (!primaryKey) throw new Error('Primary key not found');

    return {
        insert: `INSERT INTO ${table.name} (${Object.keys(table.columns).join(', ')}) VALUES (${Object.keys(table.columns).map((c) => ':' + c).join(', ')})`,
        update: `UPDATE ${table.name} SET ${Object.keys(table.columns).map((c) => `${c} = :${c}`).join(', ')} WHERE ${primaryKey} = :${primaryKey}`,
        delete: `DELETE FROM ${table.name} WHERE ${primaryKey} = :${primaryKey}`,
        select: `SELECT * FROM ${table.name} WHERE ${primaryKey} = :${primaryKey}`
    }
}

const parseInnerJoin = (sql: string) => {
    const join = sql.match(/INNER JOIN(\s*)(\w+)(\s*)ON(\s*)(.+)/i);
    if (!join) return false;

}

const parseSelect = (sql: string, tables: Table[]): { [key: string]: Primitive } => {
    const name = tableName(sql);
    const table = tables.find((t) => t.name === name);
    if (!table) throw new Error('Table not found');

    const selectArr = sql.match(/SELECT((.|\s+|,)+)FROM/gi);
    if (!selectArr) throw new Error('SELECT statement not found');
    const selectInfo = selectArr[0].replace(/SELECT|FROM/gi, '').trim();
    if (selectInfo === '*') {
        return Object.entries(table.columns).reduce((acc, [key, value]) => {
            acc[key] = value.type;
            return acc;
        }, {} as { [key: string]: Primitive });
    } else {
        const cols = selectInfo.split(',');
        return cols.reduce((acc, col) => {
            const name = col.trim();
            if (!table.columns[name]) throw new Error(`Column ${name} not found`);
            acc[name] = table.columns[name].type;
            return acc;
        }, {} as { [key: string]: Primitive });
    
    }
}

export const parseExecQuery = (sql: string, tables: Table[]): ExecQuery => {
    const type = sqlType(sql);
    if (!type) throw new Error('Unknown SQL statement type');
    if (sql.includes('INNER JOIN')) throw new Error('INNER JOIN not supported');

    const table = tables.find((t) => t.name === tableName(sql));
    if (!table) throw new Error('Table not found');

    // get all col variables
    const colsMatch = sql.match(/:.+/g);
    if (!colsMatch) throw new Error('No variables found');
    const cols = colsMatch.map((c) => c.slice(1));
    const input: {
        [key: string]: Primitive;
    } = {};
    for (const col of cols) {
        if (!table.columns[col]) throw new Error(`Column ${col} not found`);
        input[col] = table.columns[col].type;
    }

    return {
        type,
        input,
        output: (() => {
            if (type === 'insert') return {};
            if (type === 'update') return {};
            if (type === 'delete') return {};
            if (type === 'select') return parseSelect(sql, tables);
            throw new Error('Not implemented');
        })()
    }
};

export const parseSQL = (sql: string) => {
    const statements = splitSQL(sql);
    const tables: Table[] = [];
    const queries: ExecQuery[] = [];
    for (const statement of statements) {
        switch(sqlType(statement)) {
            case 'create-table':
                tables.push(parseTable(statement));
                break;
            case 'alter-table':
                {
                    const t = tables.findIndex((t) => t.name === tableName(statement));
                    if (t === -1) throw new Error('Table not found');
                    tables[t] = alterTable(statement, tables[t]);
                }
                break;
            case 'drop-table':
                {
                    const t = tables.findIndex((t) => t.name === tableName(statement));
                    if (t === -1) throw new Error('Table not found');
                    tables.splice(t, 1);
                }
                break;
            case 'delete':
            case 'insert':
            case 'select':
            case 'update':
                queries.push(parseExecQuery(statement, tables));
                break;
        }
    }

    return {
        tables,
        queries
    };
};








if (require.main === module) {
    const sql = `
    CREATE TABLE IF NOT EXISTS Sessions (
        id TEXT PRIMARY KEY,
        accountId TEXT,
        ip TEXT,
        userAgent TEXT,
        latestActivity BIGINT,
        requests INTEGER NOT NULL DEFAULT 0,
        created BIGINT NOT NULL,
        prevUrl TEXT
    
        -- customData TEXT NOT NULL DEFAULT '{}' -- added in 1-4-0
    );
    
    CREATE TABLE IF NOT EXISTS Accounts (
        id TEXT PRIMARY KEY,
        email TEXT,
        password TEXT,
        created BIGINT NOT NULL,
        lastLogin BIGINT
    );

    SELECT accountId FROM Sessions WHERE id = :id;
    SELECT * FROM Accounts WHERE id = :id;
    -- SELECT * FROM Sessions INNER JOIN Accounts ON Sessions.accountId = Accounts.id;
    `;

    const { tables, queries } = parseSQL(sql);
    const tableTS = tables.map(tableToTS).join('\n\n');
    const queryTS = queries.map((q) => execQueryToTS(q, q.type)).join('\n\n');

    console.log(tableTS);
    console.log(queryTS);
}