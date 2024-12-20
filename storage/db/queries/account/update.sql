UPDATE Accounts
SET
    username = :username,
    "key" = :key,
    salt = :salt,
    firstName = :firstName,
    lastName = :lastName,
    email = :email,
    passwordChange = :passwordChange,
    picture = :picture,
    verified = :verified,
    verification = :verification,
    emailChange = :emailChange,
    passwordChangeDate = :passwordChangeDate,
    phoneNumber = :phoneNumber,
    customData = :customData
WHERE
    id = :id;