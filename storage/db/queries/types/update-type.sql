UPDATE TransactionTypes
SET
    name = :name,
    dateCreated = :dateCreated,
    dateModified = :dateModified
WHERE id = :id;