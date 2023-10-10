UPDATE Subtypes
SET
    name = :name;
    dateCreated = :dateCreated;
    dateModified = :dateModified;
    type = :type;
    typeId = :typeId;
WHERE id = :id;