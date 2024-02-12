INSERT INTO Blacklist (
    id,
    ip,
    created,
    accountId,
    reason
) VALUES (
    :id,
    :ip,
    :created,
    :accountId,
    :reason
);