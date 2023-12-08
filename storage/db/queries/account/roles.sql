SELECT * FROM Roles
INNER JOIN AccountRoles ON Roles.id = AccountRoles.roleId
WHERE AccountRoles.accountId = :id;