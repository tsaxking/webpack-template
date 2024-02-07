select roles.* from roles
inner join account_roles on roles.id = account_roles.role_id
where account_roles.account_id = :id;