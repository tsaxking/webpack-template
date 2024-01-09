UPDATE Sessions SET
    accountId = :accountId,
    userAgent = :userAgent,
    latestActivity = :latestActivity,
    requests = :requests,
    ip = :ip,
    prevUrl = :prevUrl
WHERE id = :id;