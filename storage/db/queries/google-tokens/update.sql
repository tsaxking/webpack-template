UPDATE GoogleTokens
SET
    token = :token
    refreshToken = :refreshToken
WHERE id = :id;