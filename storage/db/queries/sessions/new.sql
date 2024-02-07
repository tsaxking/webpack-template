insert into sessions (
    id,
    account_id,
    user_agent,
    latest_activity,
    requests,
    created,
    ip,
    prev_url
) values (
    :id,
    :account_id,
    :user_agent,
    :latest_activity,
    :requests,
    :created,
    :ip,
    :prev_url
);