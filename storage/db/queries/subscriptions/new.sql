INSERT INTO Subscriptions (
    id,
    name,
    startDate,
    endDate,
    interval,
    bucketId,
    subtypeId,
    description,
    picture,
    taxDeductible,
    amount
) VALUES (
    :id,
    :name,
    :startDate,
    :endDate,
    :interval,
    :bucketId,
    :subtypeId,
    :description,
    :picture,
    :taxDeductible,
    :amount
);