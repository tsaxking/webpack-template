select roles.* from roles
inner join account_roles on roles.id = account_roles.role_id
inner join accounts on account_roles.account_id = accounts.id
where account_roles.account_id = accounts.id
    and accounts.username = :username;