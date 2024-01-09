SELECT * FROM Members
INNER JOIN Accounts ON Members.id = Accounts.id
WHERE Accounts.username = :username;