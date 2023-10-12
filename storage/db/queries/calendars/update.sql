UPDATE Calendars
SET
    name = :name,
    alias = :alias,
    authenticated = :authenticated,
    googleId = :googleId
WHERE id = :id;