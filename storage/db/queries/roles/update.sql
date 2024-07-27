UPDATE Roles SET
    name = :name,
    description = :description,
    rank = :rank
WHERE id = :id;