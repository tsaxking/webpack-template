SELECT * FROM Transactions
WHERE
    bucketId = :bucketId
    AND date >= :from
    AND date <= :to