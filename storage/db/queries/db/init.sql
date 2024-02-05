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
    passwordChangeDate INTEGER,
    phoneNumber TEXT,
    created INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS Members (
    id TEXT PRIMARY KEY,
    title TEXT,
    status TEXT DEFAULT 'pending',
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
    -- removed in 1-2-0.sql
    roleId TEXT NOT NULL,
    permission TEXT NOT NULL,
    description TEXT
);


-- CREATE TABLE IF NOT EXISTS Limit (
--     ip TEXT PRIMARY KEY,
--     limitStart INTEGER NOT NULL,
--     limitTime INTEGER NOT NULL
-- );


CREATE TABLE IF NOT EXISTS Version (
    major INTEGER NOT NULL DEFAULT 1,
    minor INTEGER NOT NULL DEFAULT 0,
    patch INTEGER NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS Sessions (
    id TEXT PRIMARY KEY,
    accountId TEXT,
    ip TEXT,
    userAgent TEXT,
    latestActivity INTEGER,
    requests INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL,
    prevUrl TEXT
);

CREATE TABLE IF NOT EXISTS AccountSettings (
    accountId TEXT NOT NULL PRIMARY KEY,
    settings TEXT NOT NULL -- JSON
);

-- CREATE TABLE IF NOT EXISTS BlockList (
--     ip TEXT PRIMARY KEY,
--     created INTEGER NOT NULL
-- );



-- Reset the version number
DELETE FROM Version;

INSERT INTO Version (
    major,
    minor,
    patch
) VALUES (
    1,
    0,
    0
);