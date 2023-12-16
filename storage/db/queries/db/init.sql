CREATE TABLE IF NOT EXISTS Accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    key TEXT NOT NULL,
    salt TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordChange TEXT,
    picture TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    verification TEXT,
    emailChange TEXT,
    passwordChangeDate TEXT,
    phoneNumber TEXT,
    created TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS Members (
    id TEXT PRIMARY KEY,
    title TEXT,
    status TEXT,
    bio TEXT,
    resume TEXT,
    board INTEGER NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS Roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rank INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS AccountRoles (
    accountId TEXT NOT NULL,
    roleId TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Permissions (
    roleId TEXT NOT NULL,
    permission TEXT NOT NULL
);


-- CREATE TABLE IF NOT EXISTS Limit (
--     ip TEXT PRIMARY KEY,
--     limitStart INTEGER NOT NULL,
--     limitTime INTEGER NOT NULL
-- );


CREATE TABLE IF NOT EXISTS Version (
    version INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS Sessions (
    id TEXT PRIMARY KEY,
    accountId TEXT,
    ip TEXT,
    userAgent TEXT,
    latestActivity TEXT,
    requests INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL,
    prevUrl TEXT
);


-- CREATE TABLE IF NOT EXISTS BlockList (
--     ip TEXT PRIMARY KEY,
--     created INTEGER NOT NULL
-- );



-- Reset the version number
DELETE FROM Version;


INSERT INTO Version (
    version
) VALUES (
    1
);



-- App tables

CREATE TABLE IF NOT EXISTS Transactions (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL, -- in cents
    type TEXT NOT NULL, -- 'withdrawal', 'deposit'
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    date TEXT NOT NULL, -- timestamp
    bucketId TEXT NOT NULL,
    description TEXT NOT NULL,
    subtypeId TEXT NOT NULL, -- used to identify the subtype of the transaction
    taxDeductible INTEGER NOT NULL DEFAULT 0, -- 0 or 1
    archived INTEGER NOT NULL DEFAULT 0, -- 0 or 1
    picture TEXT,

    FOREIGN KEY (bucketId) REFERENCES Buckets(id)
);

CREATE TABLE IF NOT EXISTS Buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created TEXT NOT NULL, -- timestamp
    archived INTEGER NOT NULL DEFAULT 0, -- 0 or 1
    type TEXT NOT NULL -- 'debit', 'credit', 'savings'
);

CREATE TABLE IF NOT EXISTS BalanceCorrection (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- timestamp
    balance INTEGER NOT NULL, -- in cents
    bucketId TEXT NOT NULL,

    FOREIGN KEY (bucketId) REFERENCES Buckets(id)
);

CREATE TABLE IF NOT EXISTS Miles (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL, -- in miles
    date TEXT NOT NULL, -- timestamp
    archived INTEGER NOT NULL DEFAULT 0 -- 0 or 1
);

CREATE TABLE IF NOT EXISTS Subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    startDate TEXT NOT NULL, -- timestamp
    endDate TEXT, -- timestamp
    interval INTEGER NOT NULL, -- in ms
    bucketId TEXT NOT NULL,
    subtypeId TEXT NOT NULL, -- used to identify the subtype of the subscription
    description TEXT NOT NULL,
    picture TEXT,
    taxDeductible INTEGER NOT NULL DEFAULT 0, -- 0 or 1
    amount INTEGER NOT NULL, -- in cents
    archived INTEGER NOT NULL DEFAULT 0, -- 0 or 1

    FOREIGN KEY (bucketId) REFERENCES Buckets(id)
);

CREATE TABLE IF NOT EXISTS TransactionTypes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    dateCreated TEXT NOT NULL, -- timestamp
    dateModified TEXT NOT NULL -- timestamp
);

CREATE TABLE IF NOT EXISTS Subtypes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dateCreated TEXT NOT NULL, -- timestamp
    dateModified TEXT NOT NULL, -- timestamp
    type TEXT NOT NULL, -- 'withdrawal', 'deposit'
    typeId TEXT NOT NULL, -- used to identify the type of the subtype

    FOREIGN KEY (typeId) REFERENCES TransactionTypes(id)
);