insert into accounts (
    id,
    username,
    "key",
    salt,
    first_name,
    last_name,
    email,
    verified,
    verification,
    created,
    phone_number
) values (
    :id,
    :username,
    :key,
    :salt,
    :first_name,
    :last_name,
    :email,
    :verified,
    :verification,
    :created,
    :phone_number
)