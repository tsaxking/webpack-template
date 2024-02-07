update roles set
    name = :name,
    description = :description,
    rank = :rank
where id = :id;