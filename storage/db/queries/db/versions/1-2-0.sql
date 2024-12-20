CREATE TABLE Blacklist (
    id TEXT PRIMARY KEY,
    ip TEXT,
    created BIGINT NOT NULL,
    accountId TEXT,
    reason TEXT
);