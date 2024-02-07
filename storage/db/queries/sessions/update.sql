update sessions set
    account_id = :account_id,
    user_agent = :user_agent,
    latest_activity = :latest_activity,
    requests = :requests,
    ip = :ip,
    prev_url = :prev_url
where id = :id;