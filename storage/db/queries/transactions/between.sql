SELECT * FROM Transactions
WHERE
    bucketId = :bucketId
    AND date >= :FROM
    AND date <= :TO