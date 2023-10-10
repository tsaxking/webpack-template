UPDATE Transactions
SET
    amount = :amount,
    type = :type,
    status = :status,
    date = :date,
    bucketId = :bucketId,
    description = :description,
    subtypeId = :subtypeId,
    taxDeductible = :taxDeductible,
    picture = :picture
WHERE id = :id;