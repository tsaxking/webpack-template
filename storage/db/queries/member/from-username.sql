select members.* from members
inner join accounts on members.id = accounts.id
where accounts.username = :username;