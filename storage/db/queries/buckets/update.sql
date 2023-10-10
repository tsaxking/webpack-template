UPDATE Buckets
SET
    name = :name,
    description = :description,
    created = :created,
    type = :type
WHERE id = :id;