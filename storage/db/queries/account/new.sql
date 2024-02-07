INSERT INTO Accounts (
    id,
    username,
    "key",
    salt,
    firstName,
    lastName,
    email,
    verified,
    verification,
    created,
    phoneNumber
) VALUES (
    :id,
    :username,
    :key,
    :salt,
    :firstName,
    :lastName,
    :email,
    :verified,
    :verification,
    :created,
    :phoneNumber
)