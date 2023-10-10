INSERT INTO Transactions (
    id,
    amount,
    type,
    status,
    date,
    bucketId,
    description,
    subtypeId,
    taxDeductible,
    picture
) VALUES (
    :id,
    :amount,
    :type,
    :status,
    :date,
    :bucketId,
    :description,
    :subtypeId,
    :taxDeductible,
    :picture
);