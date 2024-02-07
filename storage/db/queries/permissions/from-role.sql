select 
    permissions.*
from permissions
inner join role_permissions on permissions.permission = role_permissions.permission
where role_permissions.role_id = :role_id;