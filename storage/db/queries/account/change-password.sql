UPDATE Accounts
SET "key" = :key, salt = :salt, passwordChange = :passwordChange
WHERE id = :id