UPDATE Subscriptions
SET
    name = :name,
    startDate = :startDate,
    endDate = :endDate,
    interval = :interval,
    bucketId = :bucketId,
    subtypeId = :subtypeId,
    description = :description,
    picture = :picture,
    taxDeductible = :taxDeductible,
    amount = :amount
WHERE id = :id;