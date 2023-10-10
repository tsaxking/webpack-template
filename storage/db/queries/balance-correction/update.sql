UPDATE BalanceCorrection
SET amount = :amount,
    date = :date,
    bucketId = :bucketId
WHERE id = :id;