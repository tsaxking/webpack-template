INSERT INTO Transactions (
    id,
    amount,
    type,
    status,
    date,
    bucketId,
    description,
    subtypeId,
    taxDeductible
) VALUES (
    :id,
    :amount,
    :type,
    :status,
    :date,
    :bucketId,
    :description,
    :subtypeId,
    :taxDeductible
);