INSERT INTO AccountSettings (
    accountId,
    settings
) VALUES (
    :accountId,
    :settings
) ON CONFLICT (accountId) DO UPDATE SET
    settings = :settings;