INSERT INTO Sessions (
    id,
    accountId,
    userAgent,
    latestActivity,
    requests,
    created,
    ip,
    prevUrl
) VALUES (
    :id,
    :accountId,
    :userAgent,
    :latestActivity,
    :requests,
    :created,
    :ip,
    :prevUrl
);