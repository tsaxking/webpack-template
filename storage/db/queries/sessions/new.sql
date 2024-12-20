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
) ON CONFLICT (id) DO UPDATE SET
    accountId = :accountId,
    userAgent = :userAgent,
    latestActivity = :latestActivity,
    requests = :requests,
    ip = :ip,
    prevUrl = :prevUrl;