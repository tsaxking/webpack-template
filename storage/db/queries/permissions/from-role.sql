SELECT 
    Permissions.*
FROM Permissions
INNER JOIN RolePermissions ON Permissions.permission = RolePermissions.permission
WHERE RolePermissions.roleId = :roleId;