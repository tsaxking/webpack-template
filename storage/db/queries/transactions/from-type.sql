SELECT
    Transactions.id,
    Transactions.amount,
    Transactions.type,
    Transactions.status,
    Transactions.date,
    Transactions.bucketId,
    Transactions.description,
    Transactions.subtypeId,
    Transactions.taxDeductible,
    Transactions.archived,
    Transactions.picture
FROM Transactions
INNER JOIN Subtypes ON Transactions.subtypeId = Subtypes.id
WHERE Subtypes.typeId = :typeId AND Transactions.archived = 0;