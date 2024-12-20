CREATE TABLE IF NOT EXISTS AccountNotifications (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    message TEXT NOT NULL,
    title TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created BIGINT NOT NULL
);