SELECT Roles.* FROM Roles
INNER JOIN AccountRoles ON Roles.id = AccountRoles.roleId
INNER JOIN Accounts ON AccountRoles.accountId = Accounts.id
WHERE AccountRoles.accountId = Accounts.id
    AND Accounts.username = :username;