insert into account_settings (
    account_id,
    settings
) values (
    :account_id,
    :settings
) on conflict (account_id) do update set
    settings = :settings;