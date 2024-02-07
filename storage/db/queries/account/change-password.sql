update accounts
set "key" = :key, salt = :salt, password_change = :password_change
where id = :id