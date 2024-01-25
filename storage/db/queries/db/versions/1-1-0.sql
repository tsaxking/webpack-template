CREATE TABLE IF NOT EXISTS AccountSettings (
    accountId TEXT NOT NULL PRIMARY KEY,
    settings TEXT NOT NULL -- JSON
);